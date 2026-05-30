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

    public function store(Request $req){

        return $req;
    }



}
