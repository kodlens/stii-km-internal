<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Material;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(): Response
    {
        $publishedCount = Material::published()->count();
        $draftsCount = Material::where('status', 'draft')->count();
        $submittedCount = Material::whereIn('status', ['submit', 'submitted'])->count();
        $totalMaterials = Material::count();
        $vectorizedCount = Material::where('is_vectorized', 1)->count();
        $totalChunks = DB::table('material_chunks')->count();
        $categoriesCount = Category::where('active', 1)->count();
        $usersCount = User::count();

        $usersByRole = User::select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->pluck('count', 'role')
            ->all();

        $recentMaterials = Material::with(['materialCategories.category'])
            ->latest('created_at')
            ->limit(6)
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'title' => $m->title,
                    'status' => $m->status,
                    'is_publish' => (bool) $m->is_publish,
                    'is_vectorized' => (bool) $m->is_vectorized,
                    'is_categorized' => (bool) $m->is_categorized,
                    'is_summarized' => (bool) $m->is_summarized,
                    'publish_date' => $m->publish_date,
                    'created_at' => $m->created_at?->diffForHumans(),
                    'categories' => $m->materialCategories->pluck('category.category')->filter()->values()->all(),
                ];
            });

        $recentActivities = ActivityLog::with('user:id,fname,lname,username')
            ->latest('created_at')
            ->limit(7)
            ->get()
            ->map(function ($log) {
                $userName = $log->user
                    ? trim(($log->user->fname ?? '') . ' ' . ($log->user->lname ?? '')) ?: $log->user->username
                    : 'System';

                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'user_name' => $userName,
                    'time_ago' => $log->created_at?->diffForHumans(),
                ];
            });

        return Inertia::render('admin/admin-dashboard', [
            'stats' => [
                'published_count' => $publishedCount,
                'drafts_count' => $draftsCount,
                'submitted_count' => $submittedCount,
                'total_materials' => $totalMaterials,
                'vectorized_count' => $vectorizedCount,
                'total_chunks' => $totalChunks,
                'categories_count' => $categoriesCount,
                'users_count' => $usersCount,
                'users_by_role' => $usersByRole,
            ],
            'recent_materials' => $recentMaterials,
            'recent_activities' => $recentActivities,
            'ai_config' => [
                'vector_collection' => config('vectorization.qdrant.collection', 'material_chunks_internal_nomic_v1_5'),
                'generative_model' => config('rag.ollama.model', 'qwen3:14b'),
                'embedding_model' => config('vectorization.ollama.model', 'nomic-embed-text'),
            ],
        ]);
    }
}
