<?php

return [
    'queue' => env('VECTORIZATION_QUEUE', 'vectorization'),
    // Words per chunk. Must stay low enough that a chunk plus the title and
    // search_document prefix fits the model's token context window, since the
    // window is no longer measured per chunk (this Ollama build has no
    // /api/tokenize route) and embed() sends truncate: false.
    'chunk_size' => (int) env('VECTORIZATION_CHUNK_SIZE', 500),
    'chunk_overlap' => (int) env('VECTORIZATION_CHUNK_OVERLAP', 50),
    'search_candidates' => (int) env('VECTORIZATION_SEARCH_CANDIDATES', 500),

    /*
    | Experimental admin assistant. Retrieval-augmented: a question is embedded,
    | matched against the Qdrant chunks, and the retrieved passages are handed
    | to the generative model so answers are grounded in indexed material rather
    | than the model's own weights.
    */
    'chat' => [
        // Chunks fetched from Qdrant. Extra headroom over `chunks` so prompts
        // can still be filled after chunks fail verification.
        'retrieve' => (int) env('CHAT_RETRIEVE', 10),
        // Chunks actually placed in the prompt. Beyond this the added chunks
        // dilute the answer and slow first-token time without improving it.
        'chunks' => (int) env('CHAT_CHUNKS', 6),
        // Chunks scoring below this are treated as no match, so the model is
        // never asked to answer from an irrelevant passage.
        'min_score' => (float) env('CHAT_MIN_SCORE', 0.45),
        // Characters of each chunk included in the prompt.
        'chunk_chars' => (int) env('CHAT_CHUNK_CHARS', 1200),
    ],

    'ollama' => [
        'url' => env('OLLAMA_EMBED_URL', 'http://localhost:11434'),
        'model' => env('OLLAMA_EMBED_MODEL', 'nomic-embed-text:latest'),
        'dimensions' => (int) env('OLLAMA_EMBED_DIMENSIONS', 768),
        'batch_size' => (int) env('OLLAMA_EMBED_BATCH_SIZE', 8),
    ],
    'qdrant' => [
        'url' => env('QDRANT_URL', 'http://localhost:6333'),
        'api_key' => env('QDRANT_API_KEY'),
        'collection' => env('QDRANT_COLLECTION', 'material_chunks_internal_nomic_v1_5'),
    ],
];
