<?php

namespace App\Http\Controllers\Encoder;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Material;

class EncoderAllMaterialController extends Controller
{
    public function index(){
        return Inertia::render('encoder/materials/all-materials/encoder-all-materials', [
            'title' => 'All Materials'
        ]);
    }

    public function getData(Request $req){
        $perPage = $req->perpage;

        // $data = Material::with(['category'])
        //     ->join('material_categories', 'material_categories.material_id', '=', 'materials.id')
        //     ->orderBy('materials.created_at', 'desc')
        //     ->paginate($perPage);
          $data = Material::with(['materialCategories.category'])
            ->orderBy('materials.created_at', 'desc')
            ->paginate($perPage);

        return $data;
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
