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
        $retrieveLimit = (int) config('rag.retrieve', 10);
        $maxChunks = (int) config('rag.chunks', 6);
        $minScore = (float) config('rag.min_score', 0.40);
        $maxChars = (int) config('rag.chunk_chars', 1500);

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

        // 3. Hydrate chunks with published material metadata from MySQL
        $chunks = DB::table('material_chunks as mc')
            ->join('materials as m', 'm.id', '=', 'mc.material_id')
            ->whereIn('mc.qdrant_point_id', $pointIds)
            ->where('m.is_publish', 1)
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

        foreach ($points as $point) {
            $chunk = $chunks->get($point['id']);
            if (! $chunk) {
                continue;
            }

            if (count($passages) >= $maxChunks) {
                break;
            }

            $trimmedContent = Str::limit(trim($chunk->content), $maxChars);

            $passages[] = [
                'material_id' => $chunk->material_id,
                'title' => $chunk->title,
                'chunk_index' => $chunk->chunk_index,
                'content' => $trimmedContent,
                'score' => $point['score'] ?? null,
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
