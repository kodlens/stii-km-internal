<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;
use Illuminate\Support\Facades\Hash;



class AdminUserController extends Controller
{
    public function index(){
        return Inertia::render('admin/user/admin-user-index');
    }

    public function show($id){
        return User::find($id);
    }



    public function getData(Request $req){
        $validate = $req->validate([
            'search' => [ 'string', 'nullable'],
        ]);

        return User::where('username', 'like', $req->search . '%')
            ->orWhere('lname', 'like', $req->search . '%')
            ->orWhere('fname', 'like', $req->search . '%')
            ->orderBy('id', 'desc')
            ->paginate($req->perpage);
    }


     public function store(Request $req){
        $req->validate([
            'username' => ['required', 'string', 'unique:users'],
            'lname' => ['required', 'string'],
            'fname' => ['required', 'string'],
            'email' => ['required', 'email', 'unique:users'],
            'password' => ['required', 'string', 'confirmed'],
            //'sex' => ['required', 'string'],
            'role' => ['required', 'string'],
        ]);

        User::create([
            'username' => $req->username,
            'password' => Hash::make($req->password),
            'lname' => $req->lname,
            'fname' => $req->fname,
            'mname' => $req->mname,
            'email' => $req->email,
            //'sex' => strtoupper($req->sex),
            'role' => $req->role,
            'is_ojt' =>$req->is_ojt ? 1 : 0,
            'active' => $req->active ? 1 : 0,
        ]);

        return response()->json([
            'status' => 'saved'
        ], 200);
    }

    public function update(Request $req, $id){
        //return $req;
        $req->validate([
            'username' => ['required', 'string', 'unique:users,username,'. $id . ',id'],
            'lname' => ['required', 'string'],
            'email' => ['required', 'email', 'unique:users,email,'. $id . ',id'],
            //'sex' => ['required', 'string'],
            'role' => ['required', 'string'],
        ]);

        User::where('id', $id)
            ->update([
                'username' => $req->username,
                'lname' => $req->lname,
                'fname' => $req->fname,
                'mname' => $req->mname,
                'email' => $req->email,
               // 'sex' => strtoupper($req->sex),
                'role' => $req->role,
                'is_ojt' =>$req->is_ojt ? 1 : 0,
            ]);

        return response()->json([
            'status' => 'updated'
        ], 200);
    }

    public function destroy($id){
        User::destroy($id);

        return response()->json([
            'status' => 'deleted'
        ], 200);
    }


    public function changePassword(Request $req, $id){

        $req->validate([
            'password' => ['required', 'confirmed'],

        ]);

        $data = User::find($id);
        $data->password = Hash::make($req->password);
        $data->save();

        return response()->json([
            'status' => 'changed'
        ], 200);
    }


}
