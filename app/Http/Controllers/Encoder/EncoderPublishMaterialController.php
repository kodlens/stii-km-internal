<?php

namespace App\Http\Controllers\Encoder;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Material;


class EncoderPublishMaterialController extends Controller
{
    public function index(){
        return Inertia::render('encoder/materials/published-materials/encoder-published-materials-index', [
            'title' => 'Draft Materials'
        ]);
    }


    public function getData(Request $req){
        $perPage = $req->perpage;

        $data = Material::where('status', 'published')
            ->paginate($perPage);

        return $data;
    }

}
