<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\Material;
use App\Models\MaterialSubjectHeading;
use App\Services\Summarizer;
use App\Services\Categorizer;
use Illuminate\Support\Facades\Log;


class CategorizeMaterial implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $timeout = 120;


    /**
     * Create a new job instance.
     */
    public function __construct(public int $materialId,)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $material = Material::findOrFail($this->materialId);

        $content = $material->content_text;
        $title = $material->title;

        if (blank($content)) {
            return;
        }

        // Mark as not successfully categorized yet
        $material->update([
            'is_categorized' => 0,
        ]);

        $summary = (new Summarizer($content))->summarize();
        $result = (new Categorizer($summary))->categorize();

        Log::info('Material Result:', [
            'summary' => $summary,
            'result' => $result
        ]);

        if(!$result['success'] || empty($result['results'])){
            Log::error('Categorization failed', [
                'material_id' => $this->materialId,
                'result' => $result,
            ]);

            return;
        }

        //$data = json_decode($result, true);
        //Delete existing topics for this material

        MaterialSubjectHeading::where('material_id', $material->id)->delete();

        // Insert new topics
        foreach ($result['results'] as $topic) {
            MaterialSubjectHeading::create([
                'material_id' => $material->id,
                'subject_heading_id' => $topic['id'],
                'analysis' => $topic['analysis'],
                'score' => $topic['score']
            ]);
        }

        // Successfully categorized
        $material->update([
            'is_categorized' => 1,
        ]);

    }
}
