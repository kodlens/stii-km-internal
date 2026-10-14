# KM STII INTERNAL

This is km internal for DOST-STII

## TECHSTACK

    PHP 8.2
    LARAVEL 12.x.x (React, Inertia JS)
    NODEJS 22.x


## TOOLS

  smalot/pdfparser


  start from simple approach, next phase for semantic search and AI
  use smalot/pdfparser for pdf reading text


    composer require smalot/pdfparser



## Vectorization of Material

### Vectorization and Storage

We use Qdrant to store and search vector embeddings of our materials. The workflow is:

1. Split each material’s text into smaller chunks.
2. Convert each chunk into a vector using an embedding model (nomic-embed-text:latest using OLLAMA).
3. Store the vectors in Qdrant, along with metadata linking them to the original material.


This enables semantic search, allowing the system to find relevant content based on meaning rather than exact keyword matches.

Queue for creating chunks and vectorization, run the job using this command

    php artisan queue:work --queue=vectorization
or  

    php artisan queue:work --queue=vectorization --timeout=600

Test material for vectorization (for testing only)

    php artisan materials:queue-vectors --material-id=123

For testing if the job is running in the background, test using material 123 for extraction using tinker

    php artisan tinker

    then

    \App\Jobs\ExtractMaterialMetadata::dispatch(123)->onQueue('metadata');

For queueing job with limit using parameter (you may change the value 100)

    php artisan materials:queue-vectors --limit=100
