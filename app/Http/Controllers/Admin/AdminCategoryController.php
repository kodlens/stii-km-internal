<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Str;
use App\Models\Category;


class AdminCategoryController extends Controller
{
    public function index(){
        return Inertia::render('admin/admin-category/admin-category-index',[
            'title' => 'Categories Management'
        ]);
    }

    public function getData(Request $req){

        $validated = $req->validate([
            'search' => ['nullable', 'string']
        ]);

        $perPage = max(5, min(100, (int) ($req->input('perpage', 10))));
        $search = trim($validated['search'] ?? '');

        $data = Category::query()
            ->withCount('materialCategories')
            ->when($search, function ($q) use ($search) {
                $q->where('category', 'like', "%{$search}%");
            })
            ->orderBy('category')
            ->paginate($perPage);

        return response()->json($data);
    }

    public function store(Request $req){

        $validated = $req->validate([
            'category' => ['required', 'string', 'max:100'],
            'active' => ['nullable']
        ]);

        Category::create([
            'category' => $validated['category'],
            'slug' => Str::slug($validated['category']),
            'active' => $validated['active'] ? 1 : 0
        ]);

        return response()->json([
            'success' => true,
            'type' => 'store',
            'message' => 'Category successfully added.'
        ], 200);
    }

    public function update(Request $req, $id){

        $validated = $req->validate([
            'category' => ['required', 'string', 'max:100', 'unique:categories,category,' .$id.',id'],
            'active' => ['nullable']
        ]);

        $data = Category::findOrFail($id);

        $data->update([
            'category' => $validated['category'],
            'slug' => Str::slug($validated['category']),
            'active' => $validated['active'] ? 1 : 0
        ]);

        return response()->json([
            'success' => true,
            'type' => 'update',
            'message' => 'Category successfully updated.'
        ], 200);
    }

    public function destroy($id){

        Category::destroy($id);

        return response()->json([
            'success' => true,
            'type' => 'delete',
            'message' => 'Category successfully deleted.'
        ], 200);
    }
}
