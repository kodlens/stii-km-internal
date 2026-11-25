<?php

namespace App\Http\Controllers\PublicFace;

use App\Http\Controllers\Controller;
use App\Services\Rag\OllamaGenerativeService;
use App\Services\Rag\RagContextRetriever;
use App\Services\Rag\RagPromptBuilder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class ChatAssistantController extends Controller
{
    public function __construct(
        private RagContextRetriever $retriever,
        private RagPromptBuilder $promptBuilder,
        private OllamaGenerativeService $generator,
    ) {}

    public function chat(Request $request)
    {


        $validated = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
            'history' => ['nullable', 'array', 'max:20'],
            'history.*.role' => ['required_with:history', 'string', 'in:user,assistant'],
            'history.*.content' => ['required_with:history', 'string', 'max:4000'],
        ]);

        $userMessage = trim($validated['message']);
        $history = $validated['history'] ?? [];

        // Check if client requested streaming (SSE)
        $isStream = str_contains((string) $request->header('Accept'), 'text/event-stream') || $request->boolean('stream', false);

        if ($isStream) {
            return response()->stream(function () use ($userMessage, $history) {
                // Clean output buffers to ensure live streaming
                while (ob_get_level() > 0) {
                    ob_end_clean();
                }

                $sendEvent = function (string $event, array $data) {
                    echo "event: {$event}\n";
                    echo 'data: ' . json_encode($data) . "\n\n";
                    if (ob_get_level() > 0) {
                        ob_flush();
                    }
                    flush();
                };

                try {
                    // 1. Retrieve relevant material passages and sources
                    $context = $this->retriever->retrieveContext($userMessage);

                    // Send sources immediately so UI renders citation pills right away
                    $sendEvent('sources', [
                        'sources' => $context['sources'] ?? [],
                    ]);

                    // 2. Assemble grounded prompt with passages and conversational history
                    $messages = $this->promptBuilder->buildMessages(
                        $userMessage,
                        $context['passages'],
                        $history
                    );

                    // 3. Stream tokens from Ollama in real-time
                    $this->generator->streamReply($messages, function (string $token) use ($sendEvent) {
                        $sendEvent('token', ['token' => $token]);
                    });

                    // 4. Completed
                    $sendEvent('done', ['done' => true]);
                } catch (Throwable $e) {
                    Log::error('RAG Streaming Chat Error', [
                        'message' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);

                    $sendEvent('error', [
                        'message' => 'Sorry, I am having trouble connecting to the AI service right now. Please try again shortly.',
                    ]);
                }
            }, 200, [
                'Content-Type' => 'text/event-stream',
                'Cache-Control' => 'no-cache, no-transform',
                'Connection' => 'keep-alive',
                'X-Accel-Buffering' => 'no',
            ]);
        }

        try {
            // 1. Retrieve relevant material passages and sources
            $context = $this->retriever->retrieveContext($userMessage);

            // 2. Assemble grounded prompt with passages and conversational history
            $messages = $this->promptBuilder->buildMessages(
                $userMessage,
                $context['passages'],
                $history
            );

            // 3. Call Ollama generative model (Qwen 14B)
            $reply = $this->generator->generateReply($messages);

            return response()->json([
                'success' => true,
                'reply' => $reply,
                'sources' => $context['sources'],
            ]);
        } catch (Throwable $e) {
            Log::error('RAG Chat Assistant Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Sorry, I am having trouble connecting to the AI service right now. Please try again shortly.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
