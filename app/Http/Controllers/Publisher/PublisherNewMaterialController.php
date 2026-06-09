<?php

namespace App\Http\Controllers\Publisher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Http\Controllers\Base\MaterialController;
use App\Models\Material;

class PublisherNewMaterialController extends MaterialController
{
    public function index()
    {
        $ckLicense = config('app.ck_license');

        return Inertia::render('publisher/materials/publisher-new-material-index', [
            'material' => [],
            'ckLicense' => $ckLicense
        ]);
    }


    public function edit($id){
        $material = Material::with(['materialCategories.category'])
            ->find($id);

        $ckLicense = config('app.ck_license');

        return Inertia::render('publisher/materials/publisher-new-material-index', [
            'material' => $material,
            'ckLicense' => $ckLicense
        ]);
    }
}
