<?php

namespace App\Http\Controllers\Encoder;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Material;

class EncoderDraftMaterialController extends Controller
{
    public function index(){
        return Inertia::render('encoder/materials/draft-materials/encoder-draft-materials-index', [
            'title' => 'Draft Materials'
        ]);
    }


    public function getData(Request $req){
        $perPage = $req->perpage;

        $data = Material::where('status', 'draft')
            ->paginate($perPage);

        return $data;
    }



    public function destroy($id){

        $material = Material::find($id);

        if($material->status === 'submitted' || $material->status === 'published'){
            return response()->json([
                'success' => false,
                'message' => 'You can not delete submitted or published material.'
            ], 200);
        }

        $material->delete();

        return response()->json([
            'success' => true,
            'message' => 'Material successfully deleted.'
        ], 200);
    }




}
