<?php

return [
    'ollama_ai' => env('OLLAMA_AI', 'http://10.10.140.43:11434'),
    'generative_model' => env('OLLAMA_GENERATIVE_MODEL', 'qwen3:14b'),
    'num_ctx' => (int) env('OLLAMA_NUM_CTX', 16384),
    'timeout' => (int) env('OLLAMA_TIMEOUT', 180),

    // RAG retrieval settings
    'retrieve' => (int) env('CHAT_RETRIEVE', 40),
    'chunks' => (int) env('CHAT_CHUNKS', 4),
    'max_chunks_per_material' => (int) env('CHAT_MAX_CHUNKS_PER_MATERIAL', 2),
    'min_score' => (float) env('CHAT_MIN_SCORE', 0.52),
    'score_dropoff' => (float) env('CHAT_SCORE_DROPOFF', 0.028),
    'chunk_chars' => (int) env('CHAT_CHUNK_CHARS', 4000),
];
