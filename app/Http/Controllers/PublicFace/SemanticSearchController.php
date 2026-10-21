<?php

namespace App\Http\Controllers\PublicFace;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Material;
use Illuminate\Pagination\LengthAwarePaginator;

class SemanticSearchController extends Controller
{

    public function semanticSearch(Request $req){

        $search = trim($req->search ?? '');
        $perpage = $req->input('perpage', 10);

        if ($search === '') {
            return response()->json([
                'message' => 'Search query is required.',
            ], 422);
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

        $qdrantResponse = $qdrantRequest
        ->post(
            "{$qdrantUrl}/collections/{$collection}/points/search",
            [
                'vector' => $embedding,
                'limit' => 10,
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
            ->map(function ($point) use ($chunks) {
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
            ->get()
            ->keyBy('id');



        // Attach categories to each search result
        $results = $results->map(function ($result) use ($materials) {
            $material = $materials->get($result['material_id']);

            $result['categories'] = $material
                ? $material->categories->map(fn ($category) => [
                    'category' => $category->category,
                    'slug' => $category->slug,
                    'active' => $category->active,
                ])->values()->all()
                : [];

            return $result;
        });

        $currentPage = LengthAwarePaginator::resolveCurrentPage();
        $paginatedResults = new LengthAwarePaginator(
            $results->forPage($currentPage, $perpage)->values(),
            $results->count(),
            $perpage,
            $currentPage,
            [
                'path' => request()->url(),
                'query' => request()->query(),
            ]
        );

        return response()->json([
            'search' => $search,
            'results' => $paginatedResults,
        ]);

    }
}
