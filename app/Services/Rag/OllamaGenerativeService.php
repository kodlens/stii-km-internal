<?php

namespace App\Services\Rag;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class OllamaGenerativeService
{
    /**
     * Send messages to Ollama chat endpoint and return assistant reply.
     *
     * @param array $messages
     * @return string
     */
    public function generateReply(array $messages): string
    {
        $ollamaUrl = rtrim(config('rag.ollama_ai', 'http://10.10.140.43:11434'), '/');
        $model = config('rag.generative_model', 'qwen3:14b');
        $timeout = (int) config('rag.timeout', 180);
        $numCtx = (int) config('rag.num_ctx', 16384);

        $response = Http::connectTimeout(15)
            ->timeout($timeout)
            ->post("{$ollamaUrl}/api/chat", [
                'model' => $model,
                'messages' => $messages,
                'stream' => false,
                'options' => [
                    'temperature' => 0.3,
                    'num_ctx' => $numCtx,
                ],
            ]);

        if (! $response->successful()) {
            Log::error('Ollama generative API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new RuntimeException("AI Assistant service is currently unavailable (Status: {$response->status()}).");
        }

        $reply = $response->json('message.content');

        if (blank($reply)) {
            throw new RuntimeException('AI Assistant did not generate a response.');
        }

        return trim($reply);
    }
}
