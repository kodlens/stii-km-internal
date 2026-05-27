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
}
