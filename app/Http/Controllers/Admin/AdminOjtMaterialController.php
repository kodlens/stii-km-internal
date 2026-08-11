<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Material;
use Illuminate\Http\Jsonresponse;

class AdminOjtMaterialController extends Controller
{
    public function index(){
        return Inertia::render('admin/admin-ojt-material/admin-ojt-material-index');
    }

    public function getData(Request $req) : JsonResponse
    {

        $validated = $req->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'numeric']
        ]);

        $search = trim($validated['search'] ?? '');
        $perPage = $validated['per_page'] ?? 10;

        $data = Material::with(['materialCategories.category'])
            ->when($search, function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%");
        })
        ->where('is_ojt', 1)
        ->orderBy('created_at', 'desc')
        ->paginate($perPage);

        return response()->json($data);
    }
}
