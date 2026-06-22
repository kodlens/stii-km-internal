<?php

namespace App\Http\Controllers\PublicFace;

use App\Http\Controllers\Controller;
use App\Models\Material;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ViewMaterialController extends Controller
{
    public function view($filename) {

        $material = Material::with(['materialCategories.category'])
            ->where('uploaded_file', $filename)
            ->first();

        abort_unless($material, 404);
        abort_unless($material->status === 'published', 404);
        abort_unless($material->uploaded_file, 404);

        $path = 'materials/docs/' . $filename;

        abort_unless(Storage::disk('local')->exists($path), 404);

        $categoryIds = $material->materialCategories
            ->pluck('category_id')
            ->filter()
            ->values();

        $categoryMatches = Material::query()
            ->with(['materialCategories.category'])
            ->where('status', 'published')
            ->whereNotNull('uploaded_file')
            ->whereKeyNot($material->id)
            ->when($categoryIds->isNotEmpty(), function ($query) use ($categoryIds) {
                $query->whereHas('materialCategories', function ($categoryQuery) use ($categoryIds) {
                    $categoryQuery->whereIn('category_id', $categoryIds);
                });
            })
            ->latest('published_at')
            ->limit(10)
            ->get();

        $fallbackMaterials = Material::query()
            ->with(['materialCategories.category'])
            ->where('status', 'published')
            ->whereNotNull('uploaded_file')
            ->whereKeyNot($material->id)
            ->whereNotIn('id', $categoryMatches->pluck('id'))
            ->latest('published_at')
            ->limit(10 - $categoryMatches->count())
            ->get();

        $relatedMaterials = $categoryMatches
            ->merge($fallbackMaterials)
            ->take(10)
            ->map(function ($relatedMaterial) {
                return [
                    'id' => $relatedMaterial->id,
                    'title' => $relatedMaterial->title,
                    'category' => $relatedMaterial->materialCategories
                        ->pluck('category.category')
                        ->filter()
                        ->join(', ') ?: 'Uncategorized',
                    'published_at' => optional($relatedMaterial->published_at)->format('F j, Y') ?? 'Not published',
                    'view_url' => $relatedMaterial->uploaded_file
                        ? route('user.materials.view', $relatedMaterial->uploaded_file)
                        : null,
                ];
            });

        return Inertia::render('public-face/view-material', [
            'material' => [
                'id' => $material->id,
                'title' => $material->title,
                'content' => $material->content_text ?? strip_tags($material->content ?? ''),
                'category' => $material->materialCategories
                    ->pluck('category.category')
                    ->filter()
                    ->join(', ') ?: 'Uncategorized',
                'published_at' => optional($material->published_at)->format('F j, Y') ?? 'Not published',
                'document_url' => route('user.materials.document', $material->uploaded_file),
            ],
            'relatedMaterials' => $relatedMaterials,
        ]);

    }
}
