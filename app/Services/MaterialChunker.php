<?php

namespace App\Services;

class MaterialChunker
{
    /**
     * Create a new class instance.
     */
    public function __construct(public string $content)
    {
        //
    }

    public function chunk(): array {
        $words = str_word_count($this->content, 1);

        $chunks = array_chunk($words, 500);
        $summaries = [];

        foreach ($chunks as $index => $chunk) {
            $chunkText = implode(' ', $chunk); //this will combine every array and add space
            $summary = (new Summarizer($chunkText))->summarize();

            $summaries[] = $summary;
        }

        return $summaries;
    }
}
