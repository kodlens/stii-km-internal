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
use App\Http\Controllers\Utils\FilterDom;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class MaterialController extends Controller
{

    public function store(Request $req){

        $validated = $req->validate([
            'title' => ['required', 'string', 'max:255', 'unique:materials'],
            'content' => ['required', 'string'],
            'categories.*' => ['nullable'],
            'submit_type' => ['required', 'in:save,draft,publish,submit'],
            'upload' => ['nullable', 'array'],
            'upload.*.name' => ['nullable', 'string'],
            'upload.*.type' => ['nullable', 'string', Rule::in(['application/pdf'])],
            'upload.*.response.path' => ['nullable', 'string'],
        ]);

        $user = Auth::user();

        DB::transaction(function () use ($validated, $user) {

            $uploadedFile = null;
            $originalFilename = null;

            $upload = $validated['upload'] ?? null;
            $submitType = $validated['submit_type'];

            $uploadedFile = data_get(
                $validated,
                'upload.0.response.path'
            );

            $originalFilename = data_get(
                $validated,
                'upload.0.name'
            );

            $filter = new FilterDom();
            $contentText = $filter->htmlToPlainText($validated['content']);

            $material = Material::create([
                'title' => $validated['title'],
                'slug' => Str::slug($validated['title']),
                'content' => $validated['content'],
                'content_text' => $contentText,

                'uploaded_file' => $uploadedFile,
                'original_filename' => $originalFilename,

                'status' => $submitType,
                'encoded_by_id' => $user->id
            ]);


            if (!empty($uploadedFile)) {
                $tempPath = '/temp/docs/' . $uploadedFile;
                $destinationPath = '/materials/docs/' . $uploadedFile;

                if (Storage::exists($tempPath)) {
                    Storage::move($tempPath, $destinationPath);
                }
            }


            if (!empty($validated['categories'])) {

                $data = [];

                foreach ($validated['categories'] as $category) {
                    $data[] = [
                        'material_id' => $material->id,
                        'category_id' => $category['category_id'],
                        'score' => 0,
                        'analysis' => $category['analysis'],
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


    //This will return the status base on the user role
    //and the submit type
    // private function status($submitType, $user, $lag){
    //     $role = $user->role;

    //     if($role === 'admin'){
    //         if($status === 'save'){
    //             return 'save';
    //         }
    //     }
    //     return $submitType;
    // }



    function logsDescription($action){

    }






    public function update(Request $req, $id){

        $validated = $req->validate([
            'title' => ['required', 'string', 'max:255', 'unique:materials,title,' . $id . ',id'],
            'content' => ['required', 'string'],
            'categories.*' => ['nullable'],
            'submit_type' => ['required', 'in:save,draft,publish,submit'],
            'upload' => ['nullable', 'array'],
            'upload.*.name' => ['nullable', 'string'],
            'upload.*.type' => ['nullable', 'string', Rule::in(['application/pdf'])],
            'upload.*.response.path' => ['nullable', 'string'],
        ]);

        $user = Auth::user();

        DB::transaction(function () use ($validated, $user, $id) {

            $filter = new FilterDom();
            $contentText = $filter->htmlToPlainText($validated['content']);
            $submitType = $validated['submit_type'];

            $material = Material::find($id);
            $material->title = $validated['title'];
            $material->slug = Str::slug($validated['title']);
            $material->content = $validated['content'];
            $material->content_text = $contentText;

            if($user->role !== 'admin') {
                $material->status = $submitType;
            }

            if($user->role !== 'admin') {
                $material->updated_by_id = $user->id;
            }

            $material->updated_at = now();
            $material->save();

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



    public function setPublish($id){

        $user = Auth::user();
        $material = Material::find($id);
        $material->update([
            'status' => 'published'
        ]);

         ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'publish',
            'description' => 'Material set to pubsihed.'
        ]);

        return response()->json([
            'success' => true,
            'type' => 'update',
            'message' => 'Material successfully pubsihed.'
        ], 200);
    }


}
