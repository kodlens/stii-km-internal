<?php

namespace App\Jobs;

use App\Models\Material;
use App\Services\QdrantService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DeleteMaterialVectors implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $timeout = 60;
    public array $backoff = [10, 30, 60];

    public function __construct(public int $materialId) {}

    public function handle(QdrantService $qdrant): void
    {
        if (! Material::whereKey($this->materialId)->exists()) {
            $qdrant->deleteMaterial($this->materialId);
        }
    }
}
