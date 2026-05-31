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
        ]);
    }

    public function getSearch(Request $req){
        $search = $req->search ?? '';
        $perPage = $req->per_page ?? 10;

        $data = Material::with(['materialCategories.category'])
            ->where('status', 'published')
            ->where(function ($query) use ($search) {
                $query->where('title', 'like', '%' . $search . '%')
                    ->orWhere('content_text', 'like', '%' . $search . '%');
            })
            ->orderBy('materials.created_at', 'desc')
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
                ];
            });

        return response()->json($data);
    }
}
