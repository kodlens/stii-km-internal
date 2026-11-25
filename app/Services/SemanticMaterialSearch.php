<?php

namespace App\Services;

use App\Models\MaterialChunk;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SemanticMaterialSearch
{
    public function __construct(
        private OllamaEmbeddingService $embeddings,
        private QdrantService $qdrant,
    ) {}

    public function search(string $query, array $options)
    {
        $resolved = $this->resolve($query, $options);
        $points = $resolved['points'];
        $matches = $resolved['matches'];
        $categoryCounts = $resolved['categoryCounts'];
        // $topicCounts = $resolved['topicCounts'];
        $candidateLimit = $resolved['candidateLimit'];

        $page = max(1, (int) ($options['page'] ?? 1));
        $limit = max(1, (int) ($options['limit'] ?? 10));

        // $matches is built in Qdrant score order and the dedup above keeps the
        // first sighting of each material, which is its best-scoring chunk.
        $sort = ($options['sort'] ?? 'date') === 'relevance' ? 'relevance' : 'date';
        $ordered = array_values($matches);

        if ($sort === 'date') {
            // Newest first, which is the default. publish_date is nullable, so
            // undated materials sort last rather than to the top, and id breaks
            // ties to keep paging stable across otherwise identical dates.
            usort($ordered, function (array $a, array $b): int {
                $left = strtotime((string) ($a['publish_date'] ?? '')) ?: 0;
                $right = strtotime((string) ($b['publish_date'] ?? '')) ?: 0;

                return $right <=> $left ?: ($b['id'] <=> $a['id']);
            });
        }

        $matched = count($ordered);
        $pages = max(1, (int) ceil($matched / $limit));
        // Clamp instead of returning an empty page past the end, which keeps
        // last_page and the returned rows consistent.
        $page = min($page, $pages);

        $results = array_slice($ordered, ($page - 1) * $limit, $limit);

        return [
            'success' => true,
            'data' => $results,
            // Facets are built from every match, before the slice, so the counts
            // describe the whole candidate set rather than this page.
            'facets' => [
                'categories' => $this->sortFacets($categoryCounts)
            ],
            // Mirrors Laravel's paginator shape so clients can reuse the same
            // pagination component they use for the keyword search endpoints.
            'current_page' => $page,
            'per_page' => $limit,
            'total' => $matched,
            'last_page' => $pages,
            'meta' => [
                'query' => $query,
                'mode' => 'semantic',
                'sort' => $sort,
                'returned' => count($results),
                'matched_materials' => $matched,
                'facets_scope' => 'search_candidates',
                // category/topic were not applied to this result set, so the
                // client filters it directly and the counts describe the whole
                // search rather than the current selection.
                'client_side_filters' => ['category', 'topic'],
                'page' => $page,
                'last_page' => $pages,
                'limit' => $limit,
                // total counts the candidate pool Qdrant returned, which is
                // capped, so it is a lower bound rather than a corpus total.
                'total_is_exact' => count($points) < $candidateLimit,
                'has_more' => $page < $pages,
                'candidate_limit' => $candidateLimit,
                'candidate_limit_reached' => count($points) >= $candidateLimit,
            ],
        ];
    }

    /**
     * Category and topic counts for a search, without any result rows.
     *
     * Same search key and same verification as search(), so the counts describe
     * exactly the materials that endpoint would return. Split out because a page
     * that only browses by category (an article page) needs the counts without
     * paying for the full result set.
     */
    public function counts(string $query, array $options): array
    {
        $resolved = $this->resolve($query, $options);

        return [
            'success' => true,
            'facets' => [
                'categories' => $this->sortFacets($resolved['categoryCounts']),
            ],
            'meta' => [
                'query' => $query,
                'mode' => 'semantic',
                'facets_scope' => 'search_candidates',
                'client_side_filters' => ['category', 'topic'],
                'matched_materials' => count($resolved['matches']),
                'candidate_limit' => $resolved['candidateLimit'],
                'candidate_limit_reached' => count($resolved['points']) >= $resolved['candidateLimit'],
            ],
        ];
    }

    /**
     * Run the search once and derive both the matches and their facet counts.
     */
    private function resolve(string $query, array $options): array
    {
        $candidateLimit = max(50, min(2000, (int) config('vectorization.search_candidates', 500)));
        //$candidateLimit = 700;
        $points = $this->qdrant->search(
            $this->embeddings->embedQuery($query),
            $candidateLimit,
            isset($options['min_score']) ? (float) $options['min_score'] : null,
        );

        //return $points;
        /*
            This is an example of points data structure
            {
                "id": "ff817f9f-95a4-402c-a6f9-f53d6282aba3",
                "version": 8583,
                "score": 0.7970603,
                "payload": {
                    "material_id": 4543,
                    "chunk_id": 5483,
                    "chunk_index": 0,
                    "content_hash": "44390295814ba7c76848f4f71995a058efa4ee2ae893c0aec01bc62669b1aa34",
                    "embedding_model": "nomic-embed-text:latest"
                }
            },
        */

        // SQL remains authoritative for publication and current content.
        //
        // category/topic are deliberately NOT applied here. They are browse
        // dimensions over the result set rather than search criteria: applying
        // them would narrow the candidate pool, which changed the facet counts on
        // every click and left no alternative options visible. The client filters
        // the returned set instead, so the counts stay fixed for the whole search.
        $chunks = MaterialChunk::query()
            ->whereIn('qdrant_point_id', array_column($points, 'id'))
            ->whereNotNull('vectorized_at')
            ->where('embedding_model', $this->embeddings->model())
            ->whereHas('material', fn (Builder $materials) => $this->eligibleMaterials($materials, $options))
            ->with(['material' => fn ($materials) => $this->eligibleMaterials($materials, $options)])
            ->get()->keyBy('qdrant_point_id');



        $matches = [];
        $hashes = [];
        foreach ($points as $point) {
            $chunk = $chunks->get($point['id'] ?? '');
            $material = $chunk?->material;
            $payload = $point['payload'] ?? [];
            $score = $point['score'] ?? null;
            if (! $material || isset($matches[$material->id]) || ! is_numeric($score)) {
                continue;
            }
            $hash = $hashes[$material->id] ??= $material->contentHash();
            if (($payload['material_id'] ?? null) !== (int) $material->id
                || ($payload['chunk_id'] ?? null) !== (int) $chunk->id
                || ($payload['content_hash'] ?? null) !== $hash
                || $chunk->content_hash !== $hash
                || ($payload['embedding_model'] ?? null) !== $this->embeddings->model()) {
                continue;
            }

            // Qdrant returns descending similarity, so the first valid chunk is best.
            $matches[$material->id] = [
                'id' => $material->id,
                'title' => $material->title,
                'slug' => $material->slug,
                'publish_date' => $material->publish_date,
                'source_url' => $material->source_url,
                // Video landing page, needed to render the preview thumbnail.
                // Keyword search results carry this too, so a material looks
                // the same in both lists.
                'score' => (float) $score,
                // The article's opening text, not the matched chunk. A chunk can
                // begin mid-sentence partway through an article, which reads as a
                // fragment on a result card. Capped because the client fetches
                // every candidate in one response, and full text averages far
                // more than a card can show.
                'content_text' => Str::limit($material->content_text, 200),
                'matched_chunk_id' => $chunk->id,
            ];

        }


        //return $matches;


        $categoryCounts = [];
        $topicCounts = [];
        if ($matches !== []) {
            $labels = DB::table('material_categories as mc')
                ->join('categories as c', 'c.id', '=', 'mc.category_id')
                ->whereIn('mc.material_id', array_keys($matches))
                ->orderBy('c.category')->orderBy('sh.subject_heading')
                ->get(['mc.material_id', 'c.id as category_id', 'c.category', 'c.slug as category_slug',
                    'sh.id as topic_id', 'sh.subject_heading', 'sh.slug as topic_slug']);

            foreach ($labels as $label) {
                // A material can have several topics in one category or duplicate
                // assignments. Count the material once per category and topic.
                if (! isset($matches[$label->material_id]['categories'][$label->category_id])) {
                    $categoryCounts[$label->category_id] ??= [
                        'id' => $label->category_id,
                        'name' => $label->category,
                        'slug' => $label->category_slug,
                        'count' => 0,
                    ];
                    $categoryCounts[$label->category_id]['count']++;
                }
                // if (! isset($matches[$label->material_id]['topics'][$label->topic_id])) {
                //     $topicCounts[$label->topic_id] ??= [
                //         'id' => $label->topic_id,
                //         'name' => $label->subject_heading,
                //         'slug' => $label->topic_slug,
                //         'category_id' => $label->category_id,
                //         'count' => 0,
                //     ];
                //     $topicCounts[$label->topic_id]['count']++;
                // }
                $matches[$label->material_id]['categories'][$label->category_id] = [
                    'name' => $label->category, 'slug' => $label->category_slug,
                ];
                $matches[$label->material_id]['topics'][$label->topic_id] = [
                    'name' => $label->subject_heading, 'slug' => $label->topic_slug,
                ];
            }
            foreach ($matches as &$match) {
                $match['categories'] = array_values($match['categories']);
                $match['topics'] = array_values($match['topics']);
            }
            unset($match);
        }

        return [
            'points' => $points,
            'matches' => $matches,
            'categoryCounts' => $categoryCounts,
            'topicCounts' => $topicCounts,
            'candidateLimit' => $candidateLimit,
        ];
    }

    /**
     * Highest count first, then alphabetical, so equal counts keep a stable
     * order across requests.
     */
    private function sortFacets(array $counts): array
    {
        return collect($counts)->sortBy([
            ['count', 'desc'], ['name', 'asc'], ['id', 'asc'],
        ])->values()->all();
    }

    private function eligibleMaterials(Builder|Relation $query, array $options): void
    {
        $query->where('status', 'publish')->where('is_vectorized', 1)
            ->where(fn ($q) => $q->where('trash', 0)->orWhereNull('trash'));

        $types = ['articles' => 'text', 'videos' => 'video', 'people' => 'people'];
        if (isset($types[$options['type'] ?? 'all'])) {
            $query->where('filter_type', $types[$options['type']]);
        }

        // category and topic are intentionally absent. They filter the returned
        // set on the client so the facet counts stay fixed while the user browses;
        // filtering here would change those counts on every click.
    }
}
