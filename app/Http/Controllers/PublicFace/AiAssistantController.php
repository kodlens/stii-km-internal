<?php

namespace App\Http\Controllers\PublicFace;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AiAssistantController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('public-face/ai-assistant', [
            'initialQuery' => trim($request->query('q', '')),
        ]);
    }
}
