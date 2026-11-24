<?php

namespace App\Http\Controllers\PublicFace;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Material;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ViewMaterialController extends Controller
{
    public function view(Request $request, $filename) {

        $search = trim($request->query('search', ''));

        $material = Material::with(['materialCategories.category'])
            ->where('uploaded_file', $filename)
            ->first();

        abort_unless($material, 404);
        abort_unless($material->is_publish == 1 && in_array($material->status, ['publish', 'published']) && !$material->is_trash, 404);
        abort_unless($material->uploaded_file, 404);

        $path = 'materials/docs/' . $filename;

        abort_unless(Storage::disk('local')->exists($path), 404);

        $categoryIds = $material->materialCategories
            ->pluck('category_id')
            ->filter()
            ->values();

        $categoryMatches = Material::published()
            ->with(['materialCategories.category'])
            ->whereNotNull('uploaded_file')
            ->whereKeyNot($material->id)
            ->when($categoryIds->isNotEmpty(), function ($query) use ($categoryIds) {
                $query->whereHas('materialCategories', function ($categoryQuery) use ($categoryIds) {
                    $categoryQuery->whereIn('category_id', $categoryIds);
                });
            })
            ->latest('publish_date')
            ->limit(10)
            ->get();

        $fallbackMaterials = Material::published()
            ->with(['materialCategories.category'])
            ->whereNotNull('uploaded_file')
            ->whereKeyNot($material->id)
            ->whereNotIn('id', $categoryMatches->pluck('id'))
            ->latest('publish_date')
            ->limit(10 - $categoryMatches->count())
            ->get();

        $relatedMaterials = $categoryMatches
            ->merge($fallbackMaterials)
            ->take(10)
            ->map(function ($relatedMaterial) use ($search) {
                return [
                    'id' => $relatedMaterial->id,
                    'title' => $relatedMaterial->title,
                    'category' => $relatedMaterial->materialCategories
                        ->pluck('category.category')
                        ->filter()
                        ->join(', ') ?: 'Uncategorized',
                    'publish_date' => $relatedMaterial->publish_date
                        ? Carbon::parse($relatedMaterial->publish_date)->format('F j, Y')
                        : null,
                    'view_url' => $relatedMaterial->uploaded_file
                        ? route('user.materials.view', array_filter([
                            'filename' => $relatedMaterial->uploaded_file,
                            'search' => $search ?: null,
                        ]))
                        : null,
                ];
            });

        // Category breakdown for all active categories with counts
        $categoryCounts = DB::table('material_categories as mc')
            ->join('materials as m', 'm.id', '=', 'mc.material_id')
            ->where('m.is_publish', 1)
            ->whereIn('m.status', ['publish', 'published'])
            ->where('m.is_trash', 0)
            ->select('mc.category_id', DB::raw('count(*) as aggregate'))
            ->groupBy('mc.category_id')
            ->pluck('aggregate', 'category_id');

        $categories = Category::where('active', 1)
            ->get()
            ->map(function ($category) use ($categoryCounts) {
                return [
                    'id' => $category->id,
                    'category' => $category->category,
                    'slug' => $category->slug,
                    'count' => (int) ($categoryCounts[$category->id] ?? 0),
                ];
            })
            ->sortByDesc('count')
            ->values()
            ->all();

        $totalMaterials = Material::published()->count();

        $materialCategorySlugs = $material->materialCategories
            ->pluck('category.slug')
            ->filter()
            ->values()
            ->all();

        return Inertia::render('public-face/view-material', [
            'material' => [
                'id' => $material->id,
                'title' => $material->title,
                'content' => $material->content_text ?? strip_tags($material->content ?? ''),
                'category' => $material->materialCategories
                    ->pluck('category.category')
                    ->filter()
                    ->join(', ') ?: 'Uncategorized',
                'publish_date' => $material->publish_date
                    ? Carbon::parse($material->publish_date)->format('F j, Y')
                    : null,
                'document_url' => route('user.materials.document', $material->uploaded_file),
                'file_name' => $material->original_filename ?: $material->uploaded_file,
                'file_type' => strtoupper(pathinfo($material->original_filename ?: $material->uploaded_file, PATHINFO_EXTENSION)),
                'file_size' => Storage::disk('local')->size($path),
                'updated_at' => $material->updated_at?->format('F j, Y'),
            ],
            'search' => $search,
            'categories' => $categories,
            'totalMaterials' => $totalMaterials,
            'materialCategorySlugs' => $materialCategorySlugs,
            'topics' => [],
            'relatedMaterials' => $relatedMaterials,
        ]);

    }
}
