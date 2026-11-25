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

        // $context = $this->retriever->retrieveContext($userMessage);

        // $messages = $this->promptBuilder->buildMessages(
        //     $userMessage,
        //     $context['passages'],
        //     $history
        // );

        // return response()->json([
        //     'success' => true,
        //     'messaage' => $messages,
        //     'context' => $context,
        //     'sources' => $context['sources'],
        // ]);

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
