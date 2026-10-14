<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class QdrantService
{
    public function search(array $vector, int $limit, ?float $scoreThreshold = null): array
    {
        $body = [
            'query' => $vector,
            'limit' => $limit,
            'with_payload' => true,
            'with_vector' => false,
            'filter' => ['must' => [[
                'key' => 'embedding_model',
                'match' => ['value' => config('vectorization.ollama.model')],
            ]]],
        ];
        if ($scoreThreshold !== null) {
            $body['score_threshold'] = $scoreThreshold;
        }

        $response = $this->client()->post($this->collectionUrl().'/points/query', $body)->throw();
        $points = $response->json('result.points');
        if (! is_array($points) || ! array_is_list($points)) {
            throw new RuntimeException('Qdrant returned an invalid search result.');
        }

        return $points;
    }

    public function ensureCollection(): void
    {
        $response = $this->client()->get($this->collectionUrl());
        if ($response->status() === 404) {
            $created = $this->client()->put($this->collectionUrl(), [
                'vectors' => [
                    'size' => (int) config('vectorization.ollama.dimensions'),
                    'distance' => 'Cosine',
                ],
            ]);
            // Another worker may have created it between GET and PUT.
            if (! $created->successful()) {
                $existing = $this->client()->get($this->collectionUrl());
                if (! $existing->successful()) {
                    $created->throw();
                }
                $response = $existing;
            } else {
                $response = $this->client()->get($this->collectionUrl());
            }
        }

        $response->throw();
        if ($response->json('result.config.params.vectors.size') !== (int) config('vectorization.ollama.dimensions')
            || $response->json('result.config.params.vectors.distance') !== 'Cosine') {
            throw new RuntimeException('Qdrant collection must use the configured vector dimensions and Cosine distance.');
        }
    }

    /**
     * Whether the collection already holds exactly the expected points for a
     * material, indexed from the same content and embedding model.
     *
     * Deliberately stricter than "the material has points": a material can
     * still have leftover points from an older article version or a previous
     * embedding model, and those must be replaced rather than treated as done.
     * The expected ID set must match exactly, so missing, extra and stale
     * points all report false and let the caller re-index.
     */
    public function hasCurrentPoints(
        int $materialId,
        array $expectedIds,
        string $contentHash,
        string $model
    ): bool {
        if ($expectedIds === []) {
            return false;
        }

        $found = [];
        $stale = false;
        $offset = null;

        // Scroll is paginated; stop on the first page that exhausts the set.
        do {
            $body = [
                'limit' => 256,
                'with_payload' => true,
                'with_vector' => false,
                // Filter on material_id only. Filtering on hash or model here
                // would hide leftover points from an older version, and the
                // exact-set comparison below is what detects those.
                'filter' => ['must' => [
                    ['key' => 'material_id', 'match' => ['value' => $materialId]],
                ]],
            ];
            if ($offset !== null) {
                $body['offset'] = $offset;
            }

            $response = $this->client()->post($this->collectionUrl().'/points/scroll', $body);

            // A missing collection means nothing is indexed yet. Report false
            // so the caller re-indexes and ensureCollection() creates it,
            // instead of failing the job against a collection we never made.
            if ($response->status() === 404) {
                return false;
            }

            $response->throw();
            $points = $response->json('result.points');
            if (! is_array($points)) {
                throw new RuntimeException('Qdrant returned an invalid scroll result.');
            }

            foreach ($points as $point) {
                if (! is_array($point) || ! isset($point['id'])) {
                    throw new RuntimeException('Qdrant returned a scroll point without an id.');
                }

                // A point from other content or another model is stale, so the
                // set can never match and the caller re-indexes.
                if (($point['payload']['content_hash'] ?? null) !== $contentHash
                    || ($point['payload']['embedding_model'] ?? null) !== $model) {
                    $stale = true;
                }

                $found[] = (string) $point['id'];
            }

            $offset = $response->json('result.next_page_offset');
        } while ($offset !== null && count($found) < count($expectedIds));

        if ($stale) {
            return false;
        }

        $expected = array_map('strval', $expectedIds);
        sort($expected);
        sort($found);

        return $found === $expected;
    }

    public function replaceMaterialPoints(int $materialId, array $points): void
    {
        foreach (array_chunk($points, 64) as $batch) {
            $this->assertCompleted($this->client()->put($this->collectionUrl().'/points?wait=true', [
                'points' => $batch,
            ]));
        }

        $filter = ['must' => [['key' => 'material_id', 'match' => ['value' => $materialId]]]];
        if ($points !== []) {
            $filter['must_not'] = [['has_id' => array_column($points, 'id')]];
        }
        // Remove chunks left over from an earlier or longer article version.
        $this->assertCompleted($this->client()->post($this->collectionUrl().'/points/delete?wait=true', [
            'filter' => $filter,
        ]));
    }

    public function deleteMaterial(int $materialId): void
    {
        $response = $this->client()->post($this->collectionUrl().'/points/delete?wait=true', [
            'filter' => ['must' => [['key' => 'material_id', 'match' => ['value' => $materialId]]]],
        ]);
        if ($response->status() !== 404) {
            $this->assertCompleted($response);
        }
    }

    private function assertCompleted(Response $response): void
    {
        $response->throw();
        if ($response->json('result.status') !== 'completed') {
            throw new RuntimeException('Qdrant has not confirmed completion of the indexing operation.');
        }
    }

    private function collectionUrl(): string
    {
        return rtrim(config('vectorization.qdrant.url'), '/').'/collections/'
            .rawurlencode(config('vectorization.qdrant.collection'));
    }

    private function client(): PendingRequest
    {
        $client = Http::acceptJson()->connectTimeout(5)->timeout(30);
        if ($key = config('vectorization.qdrant.api_key')) {
            $client->withHeaders(['api-key' => $key]);
        }

        return $client;
    }
}
