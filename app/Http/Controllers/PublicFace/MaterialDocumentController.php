<?php

namespace App\Http\Controllers\PublicFace;

use App\Http\Controllers\Controller;
use App\Models\Material;
use Illuminate\Support\Facades\Storage;

class MaterialDocumentController extends Controller
{
    public function show($filename)
    {
        $material = Material::where('uploaded_file', $filename)->first();

        abort_unless($material, 404);
        abort_unless($material->status === 'published', 404);
        abort_unless($material->uploaded_file, 404);

        //return $material;

        //$fileName = basename($material->uploaded_file);
        //return $filename;
        $path = 'materials/docs/' . $filename;

        abort_unless(Storage::disk('local')->exists($path), 404);

        return response()->file(Storage::disk('local')->path($path), [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . addslashes($material->original_filename ?: basename($material->uploaded_file)) . '"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
