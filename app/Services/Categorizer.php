<?php

namespace App\Services;

use App\Models\SubjectHeading;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class Categorizer
{
    /**
     * Create a new class instance.
     * this script is responsible for categorizing content using qwen3
     */

    public function __construct(public string $content)
    {}

    public function categorize(): array
    {
        $content = trim($this->content);

        if (blank($content)) {
            return [
                'success' => false,
                'results' => []
            ];
        }

        $response = Http::timeout(180)->post(config('app.ollama_ai') . '/api/generate', [
            'model' => config('app.ollama_generative_model'),
            'prompt' => $this->prompt($content),
            'stream' => false,
            'options' => [
                'temperature' => 0.2,
            ],
        ]);

        if (!$response->successful()) {
            return [
                'success' => false,
                'results' => []
            ];
        }

        try {
            $result = json_decode(
                $response->json('response'),
                true,
                512,
                JSON_THROW_ON_ERROR
            );
        } catch (\JsonException $e) {

            Log::error('Qwen returned invalid JSON', [
                'response' => $response->json('response'),
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'results' => [],
            ];
        }

        if (!is_array($result)) {
            return [
                'success' => false,
                'results' => [],
            ];
        }

        return [
            'success' => true,
            'results' => $result
        ];
    }

    public function prompt(string $content): string
    {
        $topK = 3;
        $headings = SubjectHeading::where('active', 1)
            ->get(['id', 'subject_heading']);

        $subjectList = $headings
            ->map(fn ($heading) => "{$heading->id}:{$heading->subject_heading}")
            ->implode(' | ');

        $prompt = <<<PROMPT
            You are a strict classification engine, not a chatbot.

            TASK:
            Select up to {$topK} MOST RELEVANT topics from the content given below.

            RULES (MUST FOLLOW):
            - Choose ONLY from the provided topics.
            - Do NOT guess or infer loosely related topics.
            - Only select a topic if it is DIRECTLY and CLEARLY related.
            - Maximum output items: $topK
            - Minimum relevance score to include an item: 0.50
            - If fewer than $topK meet the threshold, return fewer.
            - If below threshold, do not include.
            - Strictly output should in JSON FORMAT
            - Strictly don't add words to like "Here is the ouput", you are not conversational, you are a strict classifier.

            topics (ID:Label):
            {$subjectList}

            Content:
            \"\"\"{$content}\"\"\"

            OUPUT:
            [{id: <id>, score: <score>, analysis: <you analysis why this is relevant>}]

        PROMPT;

        return $prompt;
    }
}
