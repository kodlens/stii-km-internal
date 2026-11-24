<?php
    /**
     * Material Base Class.
     * This class includes store, update and delete materials
     */


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
use Carbon\Carbon;
use App\Jobs\ChunkMaterial;


class MaterialController extends Controller
{



    public function store(Request $req){

        $validated = $req->validate([
            'title' => ['required', 'string', 'max:255', 'unique:materials'],
            'content' => ['required', 'string'],
            'publish_date' => ['nullable', 'date'],
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

            $publishDate = !empty($validated['publish_date'])
                ? Carbon::parse($validated['publish_date'], 'Asia/Manila')->format('Y-m-d')
                : null;

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

            $status = match ($submitType) {
                'publish' => 'publish',
                'submit' => 'submit',
                'draft' => 'draft',
                'save' => ($user->role === 'admin' ? 'publish' : 'draft'),
                default => 'draft',
            };

            $materialData = [
                'title' => $validated['title'],
                'slug' => Str::slug($validated['title']),
                'content' => $validated['content'],
                'publish_date' => $publishDate,
                'content_text' => $contentText,
                'uploaded_file' => $uploadedFile,
                'original_filename' => $originalFilename,
                'encoded_by_id' => $user->id,
                'status' => $status,
                'is_publish' => ($status === 'publish') ? 1 : 0,
            ];

            $material = Material::create($materialData);


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

            if ($status === 'publish') {
                $action = 'publish';
                $desc = "[$material->id] $material->title successfully inserted and published by $name.";
            } elseif ($submitType === 'submit') {
                $action = 'insert-submit';
                $desc = "[$material->id] $material->title successfully inserted and set to submitted by $name.";
            } else {
                $action = 'draft';
                $desc = "[$material->id] $material->title successfully inserted and set to draft by $name.";
            }

            ActivityLog::create([
                'user_id' => $user->id,
                'action' => $action,
                'description' => $desc
            ]);

            // Auto-chunk and vectorize published materials immediately
            if ($material->is_publish === 1) {
                ChunkMaterial::dispatch($material->id, $material->contentHash(), force: true);
            }
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
            'publish_date' => ['nullable', 'date'],
            'submit_type' => ['required', 'in:save,draft,publish,submit'],
            'upload' => ['nullable', 'array'],
            'upload.*.name' => ['nullable', 'string'],
            'upload.*.type' => ['nullable', 'string', Rule::in(['application/pdf'])],
            'upload.*.response.path' => ['nullable', 'string'],
        ]);

        $user = Auth::user();

        DB::transaction(function () use ($validated, $user, $id) {

            $publishDate = !empty($validated['publish_date'])
                ? Carbon::parse($validated['publish_date'], 'Asia/Manila')->format('Y-m-d')
                : null;

            $filter = new FilterDom();
            $contentText = $filter->htmlToPlainText($validated['content']);
            $submitType = $validated['submit_type'];

            $material = Material::find($id);
            $material->title = $validated['title'];
            $material->slug = Str::slug($validated['title']);
            $material->content = $validated['content'];
            $material->content_text = $contentText;
            $material->publish_date = $publishDate;

            $status = match ($submitType) {
                'publish' => 'publish',
                'submit' => 'submit',
                'draft' => 'draft',
                'save' => ($material->status === 'publish' ? 'publish' : ($user->role === 'admin' ? 'publish' : ($material->status ?? 'draft'))),
                default => $material->status ?? 'draft',
            };

            $material->status = $status;
            $material->is_publish = ($status === 'publish') ? 1 : 0;
            $material->updated_by_id = $user->id;
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

            if ($status === 'publish') {
                $action = 'publish';
                $desc = "[$material->id] $material->title successfully updated and published by $name.";
            } elseif ($submitType === 'submit') {
                $action = 'submit';
                $desc = "[$material->id] $material->title successfully set to submitted by $name.";
            } else {
                $action = 'update';
                $desc = "[$material->id] $material->title successfully updated as {$status} by $name.";
            }

            ActivityLog::create([
                'user_id' => $user->id,
                'action' => $action,
                'description' => $desc
            ]);

            // Auto-chunk and vectorize published materials immediately
            if ($material->is_publish === 1) {
                ChunkMaterial::dispatch($material->id, $material->contentHash(), force: true);
            }
        });

        return response()->json([
            'success' => true,
            'type' => 'update',
            'message' => 'Material successfully updated.'
        ], 200);
    }



    public function publish($id){

        $user = Auth::user();
        $material = Material::findOrFail($id);
        $material->update([
            'status' => 'publish',
            'is_publish' => 1,
            'updated_by_id' => $user->id,
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'publish',
            'description' => "Material [{$material->id}] \"{$material->title}\" set to published.",
        ]);

        ChunkMaterial::dispatch($material->id, $material->contentHash(), force: true);

        return response()->json([
            'success' => true,
            'type' => 'update',
            'message' => 'Material successfully published and queued for AI vectorization.'
        ], 200);
    }


}
