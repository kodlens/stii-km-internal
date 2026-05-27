<?php
namespace App\Http\Controllers\Utils;

use Smalot\PdfParser\Parser;

class ScanPdf {

    public function scanPdf($path){
        $parser = new Parser();

        $pdf = $parser->parseFile(
            storage_path('app/private/temp/docs/' . $path)
        );

        $text = $pdf->getText();

        if(strlen($text) < 10){
            return [
                'success' => false,
                'message'=> 'PDF is not in digital format. OCR scanning is not available this time.'
            ];
        }

        return [
            'success' => true,
            'message' => $text
        ];
    }
}
