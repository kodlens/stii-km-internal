<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Topic;

class AdminTopicController extends Controller
{
    public function index(){
        return Inertia::render('admin/admin-topic/admin-topic-index',[
            'title' => 'Categories Management'
        ]);
    }

    public function getData(Request $req){

        $validated = $req->validate([
            'search' => ['nullable', 'string']
        ]);


        $perPage = $req->perpage;
        $search = $validated['search'];

        $data = Topic::query()
            ->when($search, function ($q) use ($search) {
                $q->where('topic', 'like', "%{$search}%");
            })
            ->paginate($perPage);

        return response()->json($data);
    }

    public function create(){
        return Inertia::render('admin/admin-topic/admin-topic-add-edit', [
            'title' => "Add/Edit Topic"
        ]);
    }

    public function store(Request $req){

        $validated = $req->validate([
            'category_id' => ['required'],
            'topic' => ['required', 'string', 'max:100'],
            'active' => ['nullable']
        ]);

        Topic::create([
            'category_id' => $validated['category_id'],
            'topic' => $validated['category'],
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
