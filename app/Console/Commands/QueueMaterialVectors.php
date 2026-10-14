<?php

namespace App\Console\Commands;

use App\Services\MaterialVectorQueue;
use Illuminate\Console\Command;

class QueueMaterialVectors extends Command
{
    protected $signature = 'materials:queue-vectors
                            {--material-id= : Queue one material}
                            {--limit=100 : Maximum materials to queue (0 for no limit)}
                            {--all : Queue every matching material, ignoring --limit}
                            {--force : Reindex even if already vectorized}
                            {--after-id=0 : Only queue materials with a higher id}';

    protected $description = 'Queue chunking and Qdrant vectorization for existing materials';

    public function handle(MaterialVectorQueue $queue): int
    {
        $all = (bool) $this->option('all');
        $limit = filter_var($this->option('limit'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
        $id = $this->option('material-id');
        $afterId = filter_var($this->option('after-id'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);

        if ($limit === false || $afterId === false
            || ($id !== null && filter_var($id, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) === false)) {
            $this->error('Use positive integers for --material-id, and non-negative integers for --limit and --after-id.');

            return self::FAILURE;
        }

        // --all and an explicit --limit disagree about how many rows to take.
        // The unbounded one wins only if the other was left at its default, so
        // an explicit --limit is never silently discarded.
        if ($all && $limit !== 0 && $limit !== 100) {
            $this->error('--all cannot be combined with an explicit --limit. Use one or the other.');

            return self::FAILURE;
        }

        if ($all || $limit === 0) {
            $limit = 0;
        }

        // $include = $this->parseList($this->option('classification'));
        // $exclude = $this->parseList($this->option('exclude-classification'));

        // if ($conflicts = array_intersect($include, $exclude)) {
        //     $this->error('Cannot include and exclude the same classification: '.implode(', ', $conflicts).'.');

        //     return self::FAILURE;
        // }

        $force = (bool) $this->option('force');
        $materialId = $id === null ? null : (int) $id;

        $result = $queue->queue($limit, $force, $afterId, $materialId);

        if ($result['queued'] === 0) {
            $this->info('Nothing to queue; no materials matched the current filters.');

            return $this->reportProgress(0, 0, $result['stalled']);
        }

        $firstId = $result['first_id'];
        $lastId = $result['last_id'];
        $range = $firstId === $lastId ? "id {$firstId}" : "ids {$firstId}-{$lastId}";
        $this->info("Queued {$result['queued']} material(s) ({$range}).");

        $progress = $this->reportProgress($result['queued'], $result['remaining'], $result['stalled']);

        // With no limit nothing is left to resume, but the run may still be far
        // larger than a worker can drain, so say so rather than reporting done.
        if ($limit === 0 && $result['queued'] > 0) {
            $this->line('Queued without a limit; ensure workers keep running until the queue drains.');
        }

        return $progress;
    }

    /**
     * Report what is left so repeated runs can be told apart from stalled ones.
     */
    private function reportProgress(int $queued, int $remaining, int $stalled): int
    {
        if ($remaining > 0) {
            $this->line("Remaining pending: {$remaining}.");
            $this->line('Resume with --after-id=<last id> to skip the range just queued.');
        } else {
            $this->info('No pending materials remain for these filters.');
        }

        if ($stalled > 0) {
            // Chunks exist but none were vectorized, so ChunkMaterial ran and
            // VectorizeMaterial never completed. In-flight work looks the same,
            // so only read this as failures once the queue has drained.
            $this->warn("Chunked but not vectorized: {$stalled}.");
            $this->line('Re-check after workers drain; retry those with --material-id=<id>.');
        }

        return self::SUCCESS;
    }

    private function parseList(?string $value): array
    {
        if ($value === null || trim($value) === '') {
            return [];
        }

        return array_values(array_unique(array_filter(
            array_map('trim', explode(',', $value)),
            fn (string $item) => $item !== ''
        )));
    }
}
