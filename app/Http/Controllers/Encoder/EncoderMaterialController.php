<?php

namespace App\Http\Controllers\Encoder;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Material;
use App\Http\Controllers\Base\MaterialController;

class EncoderMaterialController extends MaterialController
{

    public function index(){
        return Inertia::render('encoder/materials/encoder-materials-page', [
            'title' => 'Materials'
        ]);
    }

    public function show($id){
        $data = Material::findOrFail($id);
        return response()->json($data, 200);
    }

    public function data(Request $req){

        $validated = $req->validate([
            'search' => ['nullable', 'string'],
            'perpage' => ['nullable', 'numeric'],
            'status' => ['nullable', 'string'],
        ]);

        $search = $validated['search'];
        $perPage = $validated['perpage'] ?? 10;
        $status = $validated['status'] ?? ''; //convert null to empty string

        $data = Material::with(['materialCategories.category'])
            ->when($search, function ($q) use ($search) {
                $q->where('title','like', "%{$search}%");
            })
            ->when($status !== '', function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->orderBy('materials.created_at', 'desc')
            ->paginate($perPage);

        return $data;
    }

    public function create(){

        $ckLicense = config('app.ck_license');
        return Inertia::render('encoder/materials/encoder-new-material-index', [
            'title' => 'Add/Edit Material',
            'ckLicense' => $ckLicense,
            'material' => null
        ]);
    }



    public function edit($id){

        $ckLicense = config('app.ck_license');
        $material = Material::with(['materialCategories.category'])->find($id);

        return Inertia::render('encoder/materials/encoder-new-material-index', [
            'title' => 'Add/Edit Material',
            'ckLicense' => $ckLicense,
            'material' => $material
        ]);
    }



    public function destroy($id){
        $material = Material::find($id);

        if($material->status === 'published' || $material->status === 'submitted'){
            return response()->json([
                'errors' => [
                    'material_id' => ['Material cannot be deleted.']
                ],
                'message' => 'Material cannot be deleted.'
            ], 422);
        }

        $material->delete();

        return response()->json([
            'success' => true,
            'type' => 'delete',
            'message' => 'Material deleted successfully.'
        ], 200);
    }



}
