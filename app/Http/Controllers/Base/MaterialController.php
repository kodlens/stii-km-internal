<?php

namespace App\Http\Controllers\Base;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Material;
use App\Models\ActivityLog;
use App\Models\MaterialCategory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Utils\FilterDOM;


class MaterialController extends Controller
{

    public function store(Request $req){
        return $req;
        $validated = $req->validate([
            'title' => ['required', 'string', 'max:255', 'unique:materials'],
            'content' => ['required', 'string'],
            'categories.*' => ['nullable'],
        ]);



        $user = Auth::user();

        DB::transaction(function () use ($validated, $user) {

            $filterDom = new FilterDOM();
            $contentText = $filterDom->htmlToPlainText($validated['content']);

            $material = Material::create([
                'title' => $validated['title'],
                'slug' => Str::slug($validated['title']),
                'content' => $validated['content'],
                'content_text' => $contentText,
                'encoded_by_id' => $user->id
            ]);

            if (!empty($validated['categories'])) {

                $data = [];

                foreach ($validated['categories'] as $category) {
                    $data[] = [
                        'material_id' => $material->id,
                        'category_id' => $category['category_id'],
                        'score' => 0,
                        'analysis' => 'Manually added.',
                    ];
                }

                MaterialCategory::insert($data);
            }

            $name = $user->lname . ', ' . $user->fname;

            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'insert',
                'description' => "[$material->id] $material->title successfully inserted by $name."
            ]);
        });

        return response()->json([
            'success' => true,
            'type' => 'store',
            'message' => 'Material successfully inserted.'
        ], 200);
    }







    public function update(Request $req, $id){

        $validated = $req->validate([
            'title' => ['required', 'string', 'max:255', 'unique:materials,title,' . $id . ',id'],
            'content' => ['required', 'string'],
            'categories.*' => ['nullable'],
        ]);

        $user = Auth::user();

        DB::transaction(function () use ($validated, $user, $id) {

            $filterDom = new FilterDOM();
            $contentText = $filterDom->htmlToPlainText($validated['content']);

            $material = Material::find($id);
            $material->update([
                'title' => $validated['title'],
                'slug' => Str::slug($validated['title']),
                'content' => $validated['content'],
                'content_text' => $contentText,
                'updated_by_id' => $user->id,
                'updated_at' => now()
            ]);

            //for update, to make it simple, delete all and insert again
            MaterialCategory::where('material_id', $material->id)->delete();

            if (!empty($validated['categories'])) {
                $data = [];

                foreach ($validated['categories'] as $category) {
                    $data[] = [
                        'material_id' => $material->id,
                        'category_id' => $category['category_id'],
                        'score' => 0,
                        'analysis' => 'Manually added.',
                    ];
                }

                MaterialCategory::insert($data);
            }

            $name = $user->lname . ', ' . $user->fname;

            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'update',
                'description' => "[$material->id] $material->title successfully updated by $name."
            ]);
        });

        return response()->json([
            'success' => true,
            'type' => 'update',
            'message' => 'Material successfully inserted.'
        ], 200);
    }



}
