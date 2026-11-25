<?php

namespace App\Services\Rag;

use App\Services\OllamaEmbeddingService;
use App\Services\QdrantService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RagContextRetriever
{
    public function __construct(
        private OllamaEmbeddingService $embeddings,
        private QdrantService $qdrant,
    ) {}

    /**
     * Retrieve relevant material passages and source citations for a query.
     *
     * @param string $query
     * @return array{passages: array, sources: array}
     */
    public function retrieveContext(string $query): array
    {
        $retrieveLimit = max(30, (int) config('rag.retrieve', 40));
        $maxChunks = (int) config('rag.chunks', 4);
        $minScore = (float) config('rag.min_score', 0.52);
        $scoreDropoff = (float) config('rag.score_dropoff', 0.028);
        $maxChars = (int) config('rag.chunk_chars', 4000);

        // 1. Embed query
        $embedding = $this->embeddings->embedQuery($query);

        // 2. Query Qdrant for matching points
        $points = $this->qdrant->search($embedding, $retrieveLimit, $minScore);

        if (empty($points)) {
            return [
                'passages' => [],
                'sources' => [],
            ];
        }

        $pointIds = collect($points)->pluck('id')->all();

        // 3. Hydrate chunks with strictly published (non-draft, non-trash) material metadata from MySQL
        $chunks = DB::table('material_chunks as mc')
            ->join('materials as m', 'm.id', '=', 'mc.material_id')
            ->whereIn('mc.qdrant_point_id', $pointIds)
            ->where('m.is_publish', 1)
            ->whereIn('m.status', ['publish', 'published'])
            ->where('m.is_trash', 0)
            ->select([
                'mc.qdrant_point_id',
                'mc.material_id',
                'mc.chunk_index',
                'mc.content',
                'm.title',
                'm.uploaded_file',
                'm.publish_date',
            ])
            ->get()
            ->keyBy('qdrant_point_id');

        $passages = [];
        $sourcesMap = [];
        $materialChunkCounts = [];
        $maxPerMaterial = (int) config('rag.max_chunks_per_material', 2);
        $topScore = null;

        foreach ($points as $point) {
            $chunk = $chunks->get($point['id']);
            if (! $chunk) {
                continue;
            }

            $score = isset($point['score']) && is_numeric($point['score']) ? (float) $point['score'] : null;

            if ($score !== null) {
                if ($topScore === null) {
                    $topScore = $score;
                }

                // Dynamic drop-off: reject chunks whose similarity score falls too far below the top match
                if ($scoreDropoff > 0 && ($topScore - $score) > $scoreDropoff) {
                    continue;
                }
            }

            // Cap the number of chunks taken from the same document to maintain diverse, high-signal context
            $count = $materialChunkCounts[$chunk->material_id] ?? 0;
            if ($maxPerMaterial > 0 && $count >= $maxPerMaterial) {
                continue;
            }

            if (count($passages) >= $maxChunks) {
                break;
            }

            $materialChunkCounts[$chunk->material_id] = $count + 1;

            $trimmedContent = $maxChars > 0
                ? Str::limit(trim($chunk->content), $maxChars)
                : trim($chunk->content);

            $passages[] = [
                'material_id' => $chunk->material_id,
                'title' => $chunk->title,
                'chunk_index' => $chunk->chunk_index,
                'content' => $trimmedContent,
                'score' => $score,
            ];

            if (! isset($sourcesMap[$chunk->material_id])) {
                $sourcesMap[$chunk->material_id] = [
                    'material_id' => $chunk->material_id,
                    'title' => $chunk->title,
                    'publish_date' => $chunk->publish_date,
                    'view_url' => $chunk->uploaded_file
                        ? route('user.materials.view', $chunk->uploaded_file)
                        : null,
                ];
            }
        }

        return [
            'passages' => $passages,
            'sources' => array_values($sourcesMap),
        ];
    }
}
