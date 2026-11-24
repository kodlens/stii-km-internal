<?php

namespace App\Http\Controllers\PublicFace;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Category;
use App\Models\Material;
use Illuminate\Pagination\LengthAwarePaginator;

class SemanticSearchController extends Controller
{

    public function semanticSearch(Request $req){

        $search = trim($req->search ?? '');
        $selectedCategory = trim($req->input('category', ''));
        $perpage = $req->input('perpage', 10);

        if ($search === '') {
            $categoryCounts = DB::table('material_categories as mc')
                ->join('materials as m', 'm.id', '=', 'mc.material_id')
                ->where('m.is_publish', 1)
                ->select('mc.category_id', DB::raw('count(*) as aggregate'))
                ->groupBy('mc.category_id')
                ->pluck('aggregate', 'category_id');

            $categories = Category::where('active', 1)
                ->get()
                ->map(fn ($cat) => [
                    'id' => $cat->id,
                    'category' => $cat->category,
                    'slug' => $cat->slug,
                    'count' => (int) ($categoryCounts[$cat->id] ?? 0),
                ])
                ->sortByDesc('count')
                ->values()
                ->all();

            $totalAll = Material::where('is_publish', 1)->count();

            $query = Material::with([
                'categories' => function ($q) {
                    $q->where('active', true)
                        ->select(['categories.id', 'category', 'slug', 'active']);
                },
            ])
            ->where('is_publish', 1);

            if ($selectedCategory !== '') {
                $query->whereHas('categories', function ($q) use ($selectedCategory) {
                    $q->where('slug', $selectedCategory)
                        ->orWhere('categories.id', $selectedCategory);
                });
            }

            $paginated = $query->latest('publish_date')
                ->paginate($perpage)
                ->through(function ($m) {
                    return [
                        'material_id' => $m->id,
                        'title' => $m->title,
                        'content' => $m->content_text ?? strip_tags($m->content ?? ''),
                        'content_text' => Str::limit($m->content_text ?? strip_tags($m->content ?? ''), 300),
                        'publish_date' => $m->publish_date,
                        'uploaded_file' => $m->uploaded_file,
                        'document_url' => $m->uploaded_file
                            ? route('user.materials.document', $m->uploaded_file)
                            : null,
                        'view_url' => $m->uploaded_file
                            ? route('user.materials.view', array_filter(['filename' => $m->uploaded_file, 'search' => $search ?: null]))
                            : null,
                        'categories' => $m->categories->map(fn ($cat) => [
                            'id' => $cat->id,
                            'category' => $cat->category,
                            'slug' => $cat->slug,
                            'active' => $cat->active,
                        ])->values()->all(),
                    ];
                });

            return response()->json([
                'search' => '',
                'selected_category' => $selectedCategory,
                'total_all' => $totalAll,
                'categories' => $categories,
                'results' => $paginated,
            ]);
        }

        // 1. Generate the query embedding using Ollama
        $response = Http::post(
            rtrim(config('vectorization.ollama.url'), '/') . '/api/embed',
            [
                'model' => config('vectorization.ollama.model'),
                'input' => $search,
            ]
        )->throw();


        // 2. Extract the generated vector
        $embedding = $response->json('embeddings.0');

        // 3. Verify the embedding
        if (!is_array($embedding) ||
            count($embedding) !== config('vectorization.ollama.dimensions')
        ) {
            return response()->json([
                'message' => 'Invalid embedding dimensions.',
            ], 500);
        }

        // 4. Inspect the result for now
        // dd([
        //     'search' => $search,
        //     'model' => config('vectorization.ollama.model'),
        //     'dimensions' => count($embedding),
        //     'collection' => config('vectorization.qdrant.collection'),
        //     'first_five_values' => array_slice($embedding, 0, 5),
        // ]);

        // Search Qdrant using the generated embedding
        $qdrantUrl = rtrim(config('vectorization.qdrant.url'), '/');
        $collection = config('vectorization.qdrant.collection');

        $qdrantRequest = Http::acceptJson();

        // Add API key only if configured
        if ($apiKey = config('vectorization.qdrant.api_key')) {
            $qdrantRequest = $qdrantRequest->withHeaders([
                'api-key' => $apiKey,
            ]);
        }

        $candidateLimit = (int) config('vectorization.search_candidates', 50);

        $qdrantResponse = $qdrantRequest
        ->post(
            "{$qdrantUrl}/collections/{$collection}/points/search",
            [
                'vector' => $embedding,
                'limit' => $candidateLimit > 0 ? $candidateLimit : 50,
                'with_payload' => true,
                'with_vector' => false,
            ]
        )
        ->throw();

        // 1. Get the matching points from Qdrant
        $points = $qdrantResponse->json('result', []);

        // 2. Extract their Qdrant point IDs
        //example of pointIds 98d6a26f-498c-4f7a-8205-1d6d777b1122
        $pointIds = collect($points)
            ->pluck('id')
            ->all();

        // 3. Find the corresponding chunks in MySQL
        $chunks = DB::table('material_chunks as mc')
            ->join('materials as m', 'm.id', '=', 'mc.material_id')
            ->whereIn('mc.qdrant_point_id', $pointIds)
            // Only published materials are visible on the public search page.
            ->where('m.is_publish', 1)
            ->select([
                'mc.qdrant_point_id',
                'mc.material_id',
                'mc.chunk_index',
                'mc.content',
                'm.content_text',
                'm.title',
                'm.publish_date',
                'm.uploaded_file'
            ])
            ->get()
            ->keyBy('qdrant_point_id');


        $results = collect($points)
            ->map(function ($point) use ($chunks, $search) {
                $chunk = $chunks->get($point['id']);

                // Skip points that have no matching MySQL record
                if (! $chunk) {
                    return null;
                }

                return [
                    //'qdrant_point_id' => $point['id'],
                    'material_id' => $chunk->material_id,
                    'title' => $chunk->title,
                    //'chunk_index' => $chunk->chunk_index,
                    'content' => $chunk->content,
                    'content_text' => Str::limit($chunk->content_text, 300),
                    'publish_date' => $chunk->publish_date,
                    'uploaded_file' => $chunk->uploaded_file,
                    // uploaded_file is only a file name, so the links are built here.
                    'document_url' => $chunk->uploaded_file
                        ? route('user.materials.document', $chunk->uploaded_file)
                        : null,
                    'view_url' => $chunk->uploaded_file
                        ? route('user.materials.view', array_filter(['filename' => $chunk->uploaded_file, 'search' => $search ?: null]))
                        : null,

                   // 'score' => $point['score'],
                ];
            })
            ->filter()
            ->values();

        $results = $results
            ->unique('material_id')
            ->values();


        // Get the material IDs from the search results
        $materialIds = $results
            ->pluck('material_id')
            ->unique()
            ->values();

        // Load each material with its active categories
        $materials = Material::with([
            'categories' => function ($query) {
                $query->where('active', true)
                    ->select([
                        'categories.id',
                        'category',
                        'slug',
                        'active',
                    ]);
            },
        ])
            ->whereIn('id', $materialIds)
            ->where('is_publish', 1)
            ->get()
            ->keyBy('id');



        // Attach categories to each search result
        $results = $results->map(function ($result) use ($materials) {
            $material = $materials->get($result['material_id']);

            $result['categories'] = $material
                ? $material->categories->map(fn ($category) => [
                    'id' => $category->id,
                    'category' => $category->category,
                    'slug' => $category->slug,
                    'active' => $category->active,
                ])->values()->all()
                : [];

            return $result;
        });

        // Compute category counts across all matching materials for this search query
        $categoryCounts = [];
        foreach ($results as $result) {
            foreach ($result['categories'] as $cat) {
                $slug = $cat['slug'];
                if (! isset($categoryCounts[$slug])) {
                    $categoryCounts[$slug] = [
                        'id' => $cat['id'],
                        'category' => $cat['category'],
                        'slug' => $slug,
                        'count' => 0,
                    ];
                }
                $categoryCounts[$slug]['count']++;
            }
        }

        $categories = collect($categoryCounts)
            ->sortBy([
                ['count', 'desc'],
                ['category', 'asc'],
            ])
            ->values()
            ->all();

        // Filter results by selected category if provided
        $selectedCategory = trim($req->input('category', ''));
        $filteredResults = $results;
        if ($selectedCategory !== '') {
            $filteredResults = $results->filter(function ($result) use ($selectedCategory) {
                return collect($result['categories'])->contains(function ($cat) use ($selectedCategory) {
                    return $cat['slug'] === $selectedCategory || (string) ($cat['id'] ?? '') === $selectedCategory;
                });
            })->values();
        }

        $currentPage = LengthAwarePaginator::resolveCurrentPage();
        $paginatedResults = new LengthAwarePaginator(
            $filteredResults->forPage($currentPage, $perpage)->values(),
            $filteredResults->count(),
            $perpage,
            $currentPage,
            [
                'path' => request()->url(),
                'query' => request()->query(),
            ]
        );

        return response()->json([
            'search' => $search,
            'selected_category' => $selectedCategory,
            'total_all' => $results->count(),
            'categories' => $categories,
            'results' => $paginatedResults,
        ]);

    }
}
