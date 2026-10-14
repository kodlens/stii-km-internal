<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class OllamaEmbeddingService
{
    private ?int $contextLength = null;

    public function model(): string
    {
        return config('vectorization.ollama.model');
    }

    public function embedDocuments(array $texts): array
    {
        return $this->embed(array_map(fn (string $text) => 'search_document: '.$text, $texts));
    }

    public function embedQuery(string $query): array
    {
        return $this->embed(['search_query: '.$query])[0];
    }

    /**
     * Largest input the model accepts in one embed call.
     */
    public function contextLength(): int
    {
        if ($this->contextLength !== null) {
            return $this->contextLength;
        }

        $response = Http::connectTimeout(10)->timeout(30)
            ->post(rtrim(config('vectorization.ollama.url'), '/').'/api/show', [
                'model' => $this->model(),
            ])->throw();



        // Ollama reports the configured window, which may be below the model's
        // maximum, so trust the running instance over a hardcoded constant.
        // The key is architecture specific ("nomic-bert.context_length",
        // "bert.context_length", ...) so match on the suffix instead of
        // maintaining an allowlist. Walk nested values too, since some builds
        // nest model_info per architecture instead of using dotted keys.
        $length = $this->findContextLength($response->json('model_info', []));

        if ($length <= 0) {
            throw new RuntimeException(
                "Ollama did not report a context length for {$this->model()}."
            );
        }

        \Log::info('Context length retrieved', [
            'length' => $length,
        ]);

        return $this->contextLength = $length;
    }

    /**
     * Deepest context_length reported anywhere in the model info tree.
     */
    private function findContextLength(mixed $info): int
    {
        if (! is_array($info)) {
            return 0;
        }

        $length = 0;
        foreach ($info as $key => $value) {
            if (str_ends_with((string) $key, 'context_length') && is_numeric($value)) {
                $length = max($length, (int) $value);
            }
            $length = max($length, $this->findContextLength($value));
        }

        return $length;
    }

    private function embed(array $inputs): array
    {
        $vectors = [];
        $dimensions = (int) config('vectorization.ollama.dimensions');
        foreach (array_chunk($inputs, max(1, (int) config('vectorization.ollama.batch_size'))) as $batch) {
            $response = Http::connectTimeout(10)->timeout(180)
                ->post(rtrim(config('vectorization.ollama.url'), '/').'/api/embed', [
                    'model' => $this->model(),
                    'input' => $batch,
                    // Never silently index only part of a passage.
                    'truncate' => false,
                ])->throw();

            $embeddings = $response->json('embeddings');
            if (! is_array($embeddings) || ! array_is_list($embeddings) || count($embeddings) !== count($batch)) {
                throw new RuntimeException('Ollama did not return one embedding per input.');
            }

            foreach ($embeddings as $embedding) {
                if (! is_array($embedding) || ! array_is_list($embedding) || count($embedding) !== $dimensions) {
                    throw new RuntimeException('Ollama returned an unexpected embedding dimension.');
                }
                $magnitude = 0.0;
                foreach ($embedding as $value) {
                    if ((! is_int($value) && ! is_float($value)) || ! is_finite((float) $value)) {
                        throw new RuntimeException('Ollama returned a non-numeric embedding.');
                    }
                    $magnitude += $value * $value;
                }
                if ($magnitude <= 0 || ! is_finite($magnitude)) {
                    throw new RuntimeException('Ollama returned an invalid embedding magnitude.');
                }
                $vectors[] = $embedding;
            }
        }

        return $vectors;
    }
}
