<?php

namespace App\Http\Controllers\PublicFace;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    public function index()
    {
        return Inertia::render('public-face/welcome');
    }
}
