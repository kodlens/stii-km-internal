<?php

namespace App\Http\Controllers\Encoder;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EncoderDashboardController extends Controller
{
     public function index(){
        return Inertia::render('encoder/encoder-dashboard');
    }
}
