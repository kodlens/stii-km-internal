<?php

namespace App\Services;

use App\Jobs\ChunkMaterial;
use App\Models\Material;
use Illuminate\Database\Eloquent\Builder;

/**
 * Selects materials for (re)vectorization and queues their chunking jobs.
 *
 * ChunkMaterial chains VectorizeMaterial once its transaction commits, so
 * queueing here is enough to run the whole pipeline. Shared by the
 * materials:queue-vectors command and the admin dashboard so both apply the
 * same selection rules and report the same progress.
 */
class MaterialVectorQueue
{
    /**
     * Queue up to $limit materials in id order and report what is left.
     *
     * A $limit of 0 means no limit: every material matching the filters is
     * queued. "Unlimited" only removes the row cap, never the filters, so
     * is_vectorized = 0 still applies unless $force is set.
     *
     * Rows are consumed in id order so repeated batches walk the table
     * instead of reselecting the same head rows.
     */
    public function queue(
        int $limit,
        bool $force = false,
        int $afterId = 0,
        ?int $materialId = null
    ): array {
        $scope = fn () => $this->materialsQuery($force, $afterId, $materialId);

        $pending = $scope()->count();
        $queued = 0;
        $firstId = null;
        $lastId = null;

        $query = $scope()->orderBy('id')
            ->select(['id', 'title', 'content_text'])
            ->when($limit > 0, fn (Builder $q) => $q->limit($limit));

        // Streamed only when unbounded. lazy() pages with forPage(), which
        // discards an applied limit(), so a bounded run must not use it.
        $materials = $limit > 0 ? $query->get() : $query->lazy(200);

        foreach ($materials as $material) {
            ChunkMaterial::dispatch($material->id, $material->contentHash())
                ->onQueue(config('vectorization.queue'))->afterCommit();
            $queued++;
            $firstId ??= $material->id;
            $lastId = $material->id;
        }

        return [
            'queued' => $queued,
            'first_id' => $firstId,
            'last_id' => $lastId,
            'remaining' => max(0, $pending - $queued),
            'stalled' => $this->stalled($scope()),
        ];
    }

    /**
     * Materials whose chunks exist but were never vectorized, which means
     * vectorization failed permanently rather than never having run.
     */
    public function stalled(Builder $query): int
    {
        return $query->whereHas('chunks')
            ->whereDoesntHave('chunks', fn (Builder $chunks) => $chunks->whereNotNull('vectorized_at'))
            ->count();
    }

    private function materialsQuery(
        bool $force,
        int $afterId,
        ?int $materialId
    ): Builder {
        $query = Material::query();

        if (! $force) {
            $query->where('is_vectorized', 0);
        }

        if ($materialId !== null) {
            $query->whereKey($materialId);
        }

        if ($afterId > 0) {
            $query->where('id', '>', $afterId);
        }


        return $query;
    }
}
