<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Category;

class OpenController extends Controller
{
    public function loadCategories(){
        return Category::where('active', 1)
            ->orderBy('category', 'asc')
            ->get();
    }

    public function loadCategoriesWithPaginate(Request $req){
        $perPage = $req->integer('perpage', 10);
        $search = $req->string('search')->trim();

        return Category::where('active', 1)
            ->when($search->isNotEmpty(), fn ($q) => $q->where('category', 'like', "%{$search}%"))
            ->orderBy('category', 'asc')
            ->paginate($perPage);
    }
}
