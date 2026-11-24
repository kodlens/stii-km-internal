<?php
namespace App\Http\Controllers\Utils;

use Smalot\PdfParser\Parser;

class ScanPdf {

    public function scanPdf($path){
        $parser = new Parser();

        $fullPath = storage_path('app/private/temp/docs/' . $path);
        if (!file_exists($fullPath)) {
            $fullPath = storage_path('app/temp/docs/' . $path);
        }

        if (!file_exists($fullPath)) {
            return [
                'success' => false,
                'message'=> "PDF file not found at: {$path}"
            ];
        }

        try {
            $pdf = $parser->parseFile($fullPath);
            $text = $pdf->getText();

            if(strlen(trim($text)) < 10){
                return [
                    'success' => false,
                    'message'=> 'PDF is not in digital format. OCR scanning is not available this time.'
                ];
            }

            return [
                'success' => true,
                'message' => $text
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'Unable to parse PDF: ' . $e->getMessage()
            ];
        }
    }
}
