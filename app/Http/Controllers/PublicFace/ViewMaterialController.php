<?php

namespace App\Http\Controllers\PublicFace;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Material;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ViewMaterialController extends Controller
{
    public function view($filename) {

        $material = Material::with(['materialCategories.category'])
            ->where('uploaded_file', $filename)
            ->first();

        abort_unless($material, 404);
        abort_unless($material->is_publish == 1, 404);
        abort_unless($material->uploaded_file, 404);

        $path = 'materials/docs/' . $filename;

        abort_unless(Storage::disk('local')->exists($path), 404);

        $categoryIds = $material->materialCategories
            ->pluck('category_id')
            ->filter()
            ->values();

        $categoryMatches = Material::query()
            ->with(['materialCategories.category'])
            ->where('is_publish', 1)
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

        $fallbackMaterials = Material::query()
            ->with(['materialCategories.category'])
            ->where('is_publish', 1)
            ->whereNotNull('uploaded_file')
            ->whereKeyNot($material->id)
            ->whereNotIn('id', $categoryMatches->pluck('id'))
            ->latest('publish_date')
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
                    'publish_date' => $relatedMaterial->publish_date
                        ? Carbon::parse($relatedMaterial->publish_date)->format('F j, Y')
                        : null,
                    'view_url' => $relatedMaterial->uploaded_file
                        ? route('user.materials.view', $relatedMaterial->uploaded_file)
                        : null,
                ];
            });

        // How many published materials sit in each category of this material.
        // The bar chart in the sidebar is drawn from these counts.
        $categoryBreakdown = collect($categoryIds)
            ->map(function ($categoryId) {
                $category = Category::find($categoryId);

                return [
                    'category' => $category?->category ?? 'Uncategorized',
                    'count' => Material::where('is_publish', 1)
                        ->whereHas('materialCategories', function ($query) use ($categoryId) {
                            $query->where('category_id', $categoryId);
                        })
                        ->count(),
                ];
            })
            ->values();

        // Topics assigned to this material.
        $topics = DB::table('materials_topics as mt')
            ->join('topics as t', 't.id', '=', 'mt.topic_id')
            ->where('mt.material_id', $material->id)
            ->where(fn ($query) => $query->where('t.active', 1)->orWhereNull('t.active'))
            ->orderBy('t.topic')
            ->pluck('t.topic')
            ->filter()
            ->values();

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
            'categoryBreakdown' => $categoryBreakdown,
            'topics' => $topics,
            'relatedMaterials' => $relatedMaterials,
        ]);

    }
}
