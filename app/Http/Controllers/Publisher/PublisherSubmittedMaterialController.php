<?php

namespace App\Http\Controllers\Publisher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Material;


class PublisherSubmittedMaterialController extends Controller
{
    public function index(){
        return Inertia::render('publisher/materials/submitted-materials/publisher-submitted-materials-index');
    }


    public function getData(Request $req){
        $perPage = request('perpage', 10);
        $search = request('search');

        $data = Material::where('status', 'submitted')
            ->when($search, function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return $data;
    }
}
