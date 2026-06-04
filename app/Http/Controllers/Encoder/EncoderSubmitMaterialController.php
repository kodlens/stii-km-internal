<?php

namespace App\Http\Controllers\Encoder;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Material;
use App\Models\ActivityLog;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;

class EncoderSubmitMaterialController extends Controller
{
    public function index(){
        return Inertia::render('encoder/materials/submitted-materials/encoder-submitted-materials-index', [
            'title' => 'Draft Materials'
        ]);
    }


    public function getData(Request $req){
        $perPage = $req->perpage;

        $data = Material::where('status', 'submitted')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return $data;
    }

    public function setSubmit($id){

        $user = Auth::user();
        $data = Material::find($id);
        $data->status = 'submitted';
        $data->is_publish = 0;
        $data->is_trash = 0;
        $data->save();

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'submit',
            'description' => "[$data->id] $data->title has been set to submit.",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Material successfully set to submit.'
        ], 200);

    }


}
