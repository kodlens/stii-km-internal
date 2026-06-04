<?php

namespace App\Http\Controllers\Encoder;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Material;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class EncoderDraftMaterialController extends Controller
{
    public function index(){
        return Inertia::render('encoder/materials/drafted-materials/encoder-drafted-materials-index', [
            'title' => 'Draft Materials'
        ]);
    }

    public function getData(Request $req){
        $perPage = $req->perpage;

        $data = Material::where('status', 'draft')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return $data;
    }

    public function setDraft($id){
        $user = Auth::user();
        $data = Material::find($id);
        $data->status = 'draft';
        $data->is_publish = 0;
        $data->is_trash = 0;
        $data->save();
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => "draft",
            'description' => "[$data->id] $data->title has been set to draft."
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Material successfully set to draft.'
        ], 200);
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
