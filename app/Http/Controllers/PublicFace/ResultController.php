<?php

namespace App\Http\Controllers\PublicFace;

use App\Http\Controllers\Controller;
use App\Models\Material;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ResultController extends Controller
{
    public function index(Request $request){
        return Inertia::render('public-face/result', [
            'search' => $request->query('search', ''),
            'category' => $request->query('category', ''),
            'page' => (int) $request->query('page', 1),
        ]);
    }

    public function getSearch(Request $req){
        $search = trim($req->search ?? '');
        $perPage = $req->per_page ?? 10;

        $query = Material::query()
            ->with(['materialCategories.category'])
            ->where('status', 'published');

        if ($search !== '') {
            $query
                ->select('materials.*')
                ->selectRaw(
                    'MATCH(title, content_text) AGAINST (? IN NATURAL LANGUAGE MODE) as relevance',
                    [$search]
                )
                ->whereFullText(['title', 'content_text'], $search)
                ->orderByDesc('relevance');
        }

        $data = $query
            ->orderByDesc('materials.created_at')
            ->paginate($perPage)
            ->through(function ($material) {
                return [
                    'id' => $material->id,
                    'category' => $material->materialCategories
                        ->pluck('category.category')
                        ->filter()
                        ->join(', ') ?: 'Uncategorized',
                    'title' => $material->title,
                    'content' => $material->content_text ?? strip_tags($material->content ?? ''),
                    'published_at' => optional($material->published_at)->format('F j, Y') ?? 'Not published',
                    'document_url' => $material->uploaded_file
                        ? route('user.materials.document', $material->uploaded_file)
                        : null,
                    'view_url' => $material->uploaded_file
                        ? route('user.materials.view', $material->uploaded_file)
                        : null,
                ];
            });

        return response()->json($data);
    }






}
