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

        $validated = $req->validate([
            'title' => ['required', 'string', 'max:255', 'unique:materials'],
            'content' => ['required', 'string'],
            'categories.*' => ['nullable'],
        ]);



        $user = Auth::user();

        DB::transaction(function () use ($req, $validated, $user) {

            $filterDom = new FilterDOM();
            $contentText = $filterDom->htmlToPlainText($validated['content']);

            $submitType = $req->submit_type ?? 'draft';

            $material = Material::create([
                'title' => $validated['title'],
                'slug' => Str::slug($validated['title']),
                'content' => $validated['content'],
                'content_text' => $contentText,
                'status' => $submitType === 'submit' ? 'submitted': 'draft',
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
            $desc = '';
            $action = 'insert';


            if($submitType === 'submit'){
                $action = 'insert-submit';
                $desc = "[$material->id] $material->title successfully insert and set to submitted by $name.";
            }

            if($submitType === 'draft'){
                $action = 'draft';
                $desc = "[$material->id] $material->title successfully insert and set to draft by $name.";
            }


            ActivityLog::create([
                'user_id' => $user->id,
                'action' => $action,
                'description' => $desc
            ]);
        });

        return response()->json([
            'success' => true,
            'type' => 'store',
            'message' => 'Material successfully inserted.'
        ], 200);
    }

    function logsDescription($action){

    }






    public function update(Request $req, $id){

        $validated = $req->validate([
            'title' => ['required', 'string', 'max:255', 'unique:materials,title,' . $id . ',id'],
            'content' => ['required', 'string'],
            'categories.*' => ['nullable'],
        ]);

        $user = Auth::user();

        DB::transaction(function () use ($req, $validated, $user, $id) {

            $filterDom = new FilterDOM();
            $contentText = $filterDom->htmlToPlainText($validated['content']);
            $submitType = $req->submit_type ?? 'draft';

            $material = Material::find($id);
            $material->update([
                'title' => $validated['title'],
                'slug' => Str::slug($validated['title']),
                'content' => $validated['content'],
                'content_text' => $contentText,
                'status' => $req->submit_type === 'publish' ? 'published': ($req->submit_type === 'submit' ? 'submitted': 'draft'),
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
            $desc = '';
            $action = 'insert';


            if($submitType === 'submit'){
                $action = 'submit';
                $desc = "[$material->id] $material->title successfully  set to submitted by $name.";
            }

            if($submitType === 'publish'){
                $action = 'publish';
                $desc = "[$material->id] $material->title successfully  set to published by $name.";
            }

            if($submitType === 'draft'){
                $action = 'draft';
                $desc = "[$material->id] $material->title successfully set to draft by $name.";
            }

            ActivityLog::create([
                'user_id' => $user->id,
                'action' => $action,
                'description' => $desc
            ]);
        });

        return response()->json([
            'success' => true,
            'type' => 'update',
            'message' => 'Material successfully inserted.'
        ], 200);
    }



}
