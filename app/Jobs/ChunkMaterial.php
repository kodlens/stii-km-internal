<?php

namespace App\Jobs;


use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\Material;
use App\Models\MaterialChunk;
use App\Services\TextChunker;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ChunkMaterial implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $timeout = 120;
    public array $backoff = [10, 30, 60];

    public ?string $contentHash = null;

    /**
     * Create a new job instance.
     */
    public function __construct(public int $materialId, ?string $contentHash = null)
    {
        $this->contentHash = $contentHash;
    }

    /**
     * Execute the job.
     */
    public function handle(TextChunker $chunker): void
    {
        DB::transaction(function () use ($chunker) {
            $material = Material::lockForUpdate()->find($this->materialId);

            if (! $material || ($this->contentHash !== null && $material->contentHash() !== $this->contentHash)) {
                return;
            }

            $hash = $material->contentHash();

            // Ollama rejects input past the context window rather than
            // truncating, so chunks must already fit. This Ollama build exposes
            // no /api/tokenize route, so the window cannot be measured per
            // chunk; chunk_size is instead kept well under the context window
            // by configuration. Passing no token counter skips that HTTP call.
            $chunks = $chunker->chunk(
                (string) $material->content_text,
                config('vectorization.chunk_size'),
                config('vectorization.chunk_overlap'),
            );

            Material::whereKey($material->id)->update(['is_vectorized' => 0]);

            foreach ($chunks as $chunk) {
                $record = MaterialChunk::firstOrNew([
                    'material_id' => $material->id,
                    'chunk_index' => $chunk['chunk_index'],
                ]);
                if ($record->content_hash !== $hash || $record->content !== $chunk['content'] || ! $record->qdrant_point_id) {
                    $record->fill([
                        'content' => $chunk['content'],
                        'content_hash' => $hash,
                        'qdrant_point_id' => (string) Str::uuid(),
                        'embedding_model' => null,
                        'vectorized_at' => null,
                    ]);
                    $record->save();
                }
            }

            MaterialChunk::where('material_id', $material->id)
                ->where('chunk_index', '>=', count($chunks))->delete();

            VectorizeMaterial::dispatch($material->id, $hash)
                ->onQueue(config('vectorization.queue'))
                ->afterCommit();
        });

    }
}
