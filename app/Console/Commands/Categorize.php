<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\CategorizeMaterial;
use App\Models\Material;

class Categorize extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:categorize';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run the categorization queue';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $materials = Material::where('is_categorized', 0)
            ->orderBy('id')
            ->limit(5)
            ->get(['id']);

        foreach ($materials as $material) {
            CategorizeMaterial::dispatch($material->id)
                ->onQueue('categorize');

            $this->info("Queued material: {$material->id}");
        }

        $this->info("Total queued: {$materials->count()}");
        return self::SUCCESS;

    }
}
