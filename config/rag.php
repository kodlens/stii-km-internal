<?php

return [
    'ollama_ai' => env('OLLAMA_AI', 'http://10.10.140.43:11434'),
    'generative_model' => env('OLLAMA_GENERATIVE_MODEL', 'qwen3:14b'),
    'timeout' => (int) env('OLLAMA_TIMEOUT', 180),

    // RAG retrieval settings
    'retrieve' => (int) env('CHAT_RETRIEVE', 10),
    'chunks' => (int) env('CHAT_CHUNKS', 6),
    'min_score' => (float) env('CHAT_MIN_SCORE', 0.40),
    'chunk_chars' => (int) env('CHAT_CHUNK_CHARS', 1500),
];
