<?php

namespace App\Http\Controllers\Encoder;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Http\Controllers\Base\MaterialController;
use App\Models\Material;

class EncoderNewMaterialController extends MaterialController
{
    public function index(){

        $ckLicense = config('app.ck_license');
        return Inertia::render('encoder/materials/encoder-new-material-index', [
            'title' => 'Add/Edit Material',
            'ckLicense' => $ckLicense
        ]);
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
