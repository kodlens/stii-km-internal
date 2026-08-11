<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;
use App\Models\Material;
use App\Http\Controllers\Base\MaterialController;

class AdminMaterialController extends MaterialController
{
    public function index(){
        return Inertia::render('admin/admin-material/admin-material-index');
    }


    public function getData(Request $req) : JsonResponse
    {

        $validated = $req->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'perpage' => ['nullable', 'numeric']
        ]);

        $search = trim($validated['search'] ?? '');
        $perPage = $validated['perpage'] ?? 10;

        $data = Material::with(['materialCategories.category'])
            ->when($search, function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%");
        })
        ->orderBy('created_at', 'desc')
        ->paginate($perPage);

        return response()->json($data);
    }

    public function create(){
        return Inertia::render('admin/admin-material/admin-material-add-edit', [
            'material' => null,
            'ckLicense' => config('app.ck_license')
        ]);
    }


    public function edit($id){
        $material = Material::with(['materialCategories.category'])->find($id);
        return Inertia::render('admin/admin-material/admin-material-add-edit', [
            'material' => $material,
            'ckLicense' => config('app.ck_license')
        ]);
    }

    public function destroy($id){
        Material::destroy($id);
        return response()->json([
            'success' => true,
            'message' => 'Material deleted successfully'
        ]);
    }


}
