<?php

namespace App\Jobs;

use App\Models\Material;
use App\Models\MaterialChunk;
use App\Services\OllamaEmbeddingService;
use App\Services\QdrantService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class VectorizeMaterial implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $timeout = 600;
    public array $backoff = [10, 30, 60];

    public function __construct(public int $materialId, public string $contentHash) {}

    public function handle(OllamaEmbeddingService $embeddings, QdrantService $qdrant): void
    {
        $material = Material::find($this->materialId);
        if (! $material || $material->contentHash() !== $this->contentHash) {
            return;
        }

        $chunks = $material->chunks()->orderBy('chunk_index')->get();
        if ($chunks->contains(fn ($chunk) => $chunk->content_hash !== $this->contentHash || ! $chunk->qdrant_point_id)) {
            return;
        }

        // Skip re-embedding when the collection already holds exactly these
        // points from the same content and model. Forced re-indexes and
        // retried jobs then cost one scroll instead of a full Ollama pass.
        if ($chunks->isNotEmpty()
            && $qdrant->hasCurrentPoints(
                $this->materialId,
                $chunks->pluck('qdrant_point_id')->all(),
                $this->contentHash,
                $embeddings->model(),
            )) {
            Material::whereKey($this->materialId)->update(['is_vectorized' => 1]);

            return;
        }

        // Ollama requests run outside the SQL transaction and row lock.
        $vectors = $embeddings->embedDocuments($chunks->map(
            fn ($chunk) => $material->title."\n\n".$chunk->content
        )->all());

        if ($chunks->isNotEmpty()) {
            $qdrant->ensureCollection();
        }

        DB::transaction(function () use ($chunks, $vectors, $embeddings, $qdrant) {
            $current = Material::lockForUpdate()->find($this->materialId);
            if (! $current || $current->contentHash() !== $this->contentHash) {
                return;
            }

            $currentChunks = $current->chunks()->orderBy('chunk_index')->get();
            if ($currentChunks->pluck('qdrant_point_id')->all() !== $chunks->pluck('qdrant_point_id')->all()) {
                return;
            }

            if ($chunks->isEmpty()) {
                $qdrant->deleteMaterial($this->materialId);
                Material::whereKey($this->materialId)->update(['is_vectorized' => 0]);
                return;
            }

            $points = [];
            foreach ($chunks as $index => $chunk) {
                $points[] = [
                    'id' => $chunk->qdrant_point_id,
                    'vector' => $vectors[$index],
                    'payload' => [
                        'material_id' => $this->materialId,
                        'chunk_id' => $chunk->id,
                        'chunk_index' => $chunk->chunk_index,
                        'content_hash' => $this->contentHash,
                        'embedding_model' => $embeddings->model(),
                    ],
                ];
            }

            // Serialize Qdrant publication with content edits/chunk replacement.
            // Qdrant is not transactional with SQL; stable IDs make retries safe.
            $qdrant->replaceMaterialPoints($this->materialId, $points);

            MaterialChunk::whereIn('id', $chunks->modelKeys())->update([
                'embedding_model' => $embeddings->model(),
                'vectorized_at' => now(),
            ]);
            Material::whereKey($this->materialId)->update(['is_vectorized' => 1]);
        });
    }

    public function failed(?Throwable $exception): void
    {
        Log::error('Material vectorization failed.', [
            'material_id' => $this->materialId,
            'content_hash' => $this->contentHash,
            'message' => $exception?->getMessage(),
        ]);
    }
}
