<?php

namespace App\Http\Controllers\Encoder;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Material;
use Inertia\Inertia;
use Inertia\Response;

class EncoderSubmitMaterialController extends Controller
{
    public function index(){
        return Inertia::render('encoder/materials/submit-materials/encoder-submit-materials-index', [
            'title' => 'Draft Materials'
        ]);
    }


    public function getData(Request $req){
        $perPage = $req->perpage;

        $data = Material::where('status', 'submitted')
            ->paginate($perPage);

        return $data;
    }
}
