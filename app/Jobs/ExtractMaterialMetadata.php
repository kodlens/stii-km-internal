<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use App\Models\Material;
use App\Models\MaterialMetadata;
use App\Models\MaterialEntity;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Client\RequestException;
use Throwable;
use Illuminate\Support\Facades\DB;

class ExtractMaterialMetadata implements ShouldQueue
{
    use Queueable;


    public int $tries = 3;
    public int $timeout = 240;

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
    public function handle(): void
    {
        try {

            $material = Material::find($this->materialId);

            if (!$material) {
                Log::warning('Material not found for metadata extraction.', [
                    'material_id' => $this->materialId,
                ]);

                return;
            }

            $hash = $material->contentHash();
            if (($this->contentHash !== null && $this->contentHash !== $hash)
                || trim((string) $material->content_text) === '') {
                return;
            }

            $aiHost02 = config('app.ai_api_02');
            $model02 = config('app.ai_model_02');

            $prompt = <<<PROMPT
            Extract structured metadata from the article below.

            Return only valid JSON using this structure:

            TEMPLATE:
            {
                "summary": "A concise factual summary",
                "key_points": [
                    "First important fact",
                    "Second important fact",
                    "Third important fact"
                ],
                "keywords": [
                    "keyword one",
                    "keyword two"
                ],
                "entities": [
                    {
                    "name": "Entity name",
                    "type": "organization|person|location|scientific_name"
                    }
                ]
            }

            General Rules:
            - Return 5 to 15 specific keywords.
            - Do not use overly general keywords such as article, news, information, or Philippines.
            - Include scientific names when present.
            - Do not invent information.
            - Do not include Markdown or explanations.
            - Strictly return JSON format only base on the template given


            Title:
            {$material->title}

            Article:
            {$material->content_text}

            PROMPT;

            Log::info('Initiate ollama call...');

            $response = Http::timeout(180)
                ->post($aiHost02 . '/api/generate', [
                    'model' => $model02,
                    'prompt' => $prompt,
                    'stream' => false,
                    'format' => 'json',
                    'think' => false,
                    'options' => [
                        'temperature' => 0.1,
                    ],
                ]);

            Log::info('Done.. Received ollama response...');

            $response->throw();

            $metadata = json_decode(
                $response->json('response'),
                true,
                512,
                JSON_THROW_ON_ERROR
            );

            //validate response
            $validator = Validator::make($metadata, [
                'summary' => ['required', 'string'],

                'keywords' => ['required', 'array', 'min:1'],
                'keywords.*' => ['required', 'string', 'max:150'],

                'entities' => ['present', 'array'],
                'entities.*.name' => ['required', 'string', 'max:255'],
                'entities.*.type' => ['required', 'string', 'max:50'],
            ]);

            if ($validator->fails()) {
                Log::error('\n\n =====================Invalid metadata structure returned by AI.=================', [
                    'material_id' => $material->id,
                    'errors' => $validator->errors()->toArray(),
                    'metadata' => $metadata,
                ]);

                throw new ValidationException($validator);
            }

            $metadata = $validator->validated();

            Log::info('Response: ', [
                'material_id' => $material->id,
                'metadata' => $metadata
            ]);

            DB::transaction(function () use ($material, $metadata, $hash) {
                $current = Material::lockForUpdate()->find($material->id);
                if (! $current || $current->contentHash() !== $hash) {
                    return;
                }

                MaterialMetadata::updateOrCreate(
                    ['material_id' => $material->id],
                    [
                        'summary' => $metadata['summary'],
                        'keywords' => $metadata['keywords'],
                    ]
                );

                MaterialEntity::where('material_id', $material->id)->delete();

                foreach ($metadata['entities'] as $entity) {
                    $name = trim($entity['name']);

                    MaterialEntity::updateOrCreate(
                        [
                            'material_id' => $material->id,
                            'normalized_name' => mb_strtolower($name, 'UTF-8'),
                            'type' => $entity['type'],
                        ],
                        [
                            'name' => $name,
                        ]
                    );
                }

                Material::where('id', $material->id)->update([
                    'is_ai_summarized' => 1,
                ]);
            });

        } catch (Throwable $e) {

            Log::error('\n\n==================Metadata extraction job encountered an error.=====================', [
                'material_id' => $this->materialId,
                'attempt' => $this->attempts(),
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),

                'ai_response' => $e instanceof RequestException
                    ? $e->response->body()
                    : null,
            ]);

            throw $e;
        }

    }


    public function failed(?Throwable $exception): void
    {
        Log::critical('Metadata extraction job permanently failed.', [
            'material_id' => $this->materialId,
            'exception' => $exception ? get_class($exception) : null,
            'message' => $exception?->getMessage(),
        ]);
    }

}
