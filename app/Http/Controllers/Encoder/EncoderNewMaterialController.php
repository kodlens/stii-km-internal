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
            'ckLicense' => $ckLicense,
            'material' => null
        ]);
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




}
