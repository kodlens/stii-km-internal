<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Category;
use App\Models\Topic;

class OpenController extends Controller
{
    public function loadCategories(){
        return Category::where('active', 1)
            ->orderBy('category', 'asc')
            ->get();
    }

    public function loadCategoriesWithPaginate(Request $req){
        $perPage = $req->integer('perpage', 10);

        return Category::where('active', 1)
            ->orderBy('category', 'asc')
            //->get();
            ->paginate($perPage);
    }


    public function getTopicsWithParams(Request $req, $catId){
        if($req->has('search') && $req->search != ''){

            if($catId == 0){
                $topics = Topic::where('active', 1)
                ->where('topic', 'like', '%'.$req->search.'%')
                ->get();
            }else {
                $topics = Category::find($catId)->topics()
                    ->where('active', 1)
                    ->where('topic', 'like', '%'.$req->search.'%')
                    ->get();
            }
            return response()->json($topics);
        }else{
            if($catId == 0){
                $topics = Topic::where('active', 1)->get();
            } else {
                $topics = Category::find($catId)->subject_headings()
                    ->where('active', 1)
                    ->get();
            }

            return response()->json($topics);
        }
    }

}
