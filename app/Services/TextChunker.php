<?php

namespace App\Services;

class TextChunker
{
    /**
     * Split text into overlapping chunks that each fit the embedding model's
     * context window.
     *
     * Word counts are not token counts, so a word-based window can still
     * overflow Ollama. When a token counter is supplied, chunks over the token
     * budget are split further instead of being sent and rejected. Note the
     * counter is invoked for every chunk, so supply null when it is expensive.
     * JOMAR
     *
     * @param  (callable(string): int)|null  $countTokens
     */
    public function chunk(
        string $text,
        int $chunkSize = 500,
        int $overlap = 75,
        ?callable $countTokens = null,
        int $maxTokens = 0
    ): array {
        if ($chunkSize < 1 || $overlap < 0 || $overlap >= $chunkSize) {
            throw new \InvalidArgumentException('Chunk size must be positive and overlap must be smaller than chunk size.');
        }

        // Remove HTML tags
        $text = strip_tags($text);

        // Normalize whitespace
        $text = preg_replace('/\s+/u', ' ', $text);
        $text = trim($text);

        if (empty($text)) {
            return [];
        }

        $words = preg_split('/\s+/u', $text);

        $chunks = [];
        $start = 0;
        $index = 0;

        while ($start < count($words)) {

            $chunkWords = array_slice(
                $words,
                $start,
                $chunkSize
            );

            $content = implode(' ', $chunkWords);

            if ($countTokens !== null && $maxTokens > 0 && $countTokens($content) > $maxTokens) {
                // Halve the window and retry the same position. Overlong text
                // needs smaller chunks, not a different starting offset.
                $smaller = (int) max(1, floor($chunkSize / 2));

                foreach ($this->chunk($text, $smaller, min($overlap, $smaller - 1), $countTokens, $maxTokens) as $sub) {
                    $sub['chunk_index'] = $index;
                    $chunks[] = $sub;
                    $index++;
                }

                return $chunks;
            }

            $chunks[] = [
                'chunk_index' => $index,
                'content' => $content,
            ];

            $start += ($chunkSize - $overlap);
            $index++;
        }

        return $chunks;
    }
}
