<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser;
use App\Http\Controllers\Utils\ScanPdf;
use Illuminate\Support\Facades\Http;


class UploadController extends Controller
{


    /** =================PDF HANDLING =================*/
    public function tempUpload(Request $req){
        @set_time_limit(300);

        $req->validate([
            'docs' => ['required', 'file', 'mimetypes:application/pdf', 'max:51200']
        ],[
            'docs.required' => 'A PDF file is required.',
            'docs.mimetypes' => 'Only PDF files are allowed.',
            'docs.max' => 'The upload PDF must not be greater than 50MB in size.'
        ]);

        $file = $req->file('docs');
        $fileGenerated = md5($file->getClientOriginalName() . time());
        $fileName = $fileGenerated . '.' . $file->getClientOriginalExtension();
        $filePath = $file->storeAs('/temp/docs', $fileName);
        $storedFileName = basename(str_replace('\\', '/', $filePath)) ?: $fileName;

        $scannedPdf = ['success' => false, 'message' => null];
        $pdfProcess = false;

        try {
            $scanPdf = new ScanPdf();
            $scannedPdf = $scanPdf->scanPdf($storedFileName);
            $pdfProcess = (bool) ($scannedPdf['success'] ?? false);
        } catch (\Throwable $e) {
            $scannedPdf = ['success' => false, 'message' => $e->getMessage()];
            $pdfProcess = false;
        }

        $ocrText = null;
        $ocrError = null;

        if(!$pdfProcess){
            // Fallback to OCR service for scanned/image-based PDFs.
            try {
                $ocrUrl = rtrim(config('services.ocr.url', 'http://127.0.0.1:8000'), '/');
                $ocrResponse = Http::connectTimeout(15)
                    ->timeout((int) config('services.ocr.timeout', 180))
                    ->attach(
                        'file',
                        file_get_contents($file->getRealPath()),
                        $file->getClientOriginalName()
                    )
                    ->post($ocrUrl . '/extract-text');

                if($ocrResponse->successful()){
                    $ocrText = trim((string) ($ocrResponse->json('text') ?? ''));
                    $pdfProcess = $ocrText !== '';
                } else {
                    $ocrError = $ocrResponse->json('detail') ?? $ocrResponse->body();
                }
            } catch (\Throwable $e) {
                $ocrError = 'OCR service connection error: ' . $e->getMessage();
            }
        }

        if(!$pdfProcess){
            Storage::delete(ltrim($filePath, '/'));
        }

        $extractedMessage = $scannedPdf['success'] ? $scannedPdf['message'] : $ocrText;

        return response()->json([
            'success' => $pdfProcess,
            'path' => $pdfProcess ? $storedFileName : null,
            'message' => $extractedMessage,
            'pdf_process' => $pdfProcess,
            'ocr_text' => $ocrText
        ] + ($ocrError ? ['ocr_error' => $ocrError] : []), $pdfProcess ? 200 : 422);

    }



    public function removeUpload($fileName){

        if(Storage::exists('temp/docs/' .$fileName)) {
            Storage::delete('temp/docs/' . $fileName);

            return response()->json([
                'status' => 'temp_deleted'
            ], 200);
        }

        // //this will remove the image from banner_image
        // if(Storage::exists('public/banner_images/' . $fileName)) {
        //     Storage::delete('public/banner_images/' . $fileName);

        //     Banner::where('img', $fileName)
        //         ->update([
        //             'img' => null
        //         ]);
        //     return response()->json([
        //         'status' => 'banner_removed'
        //     ], 200);
        // }

        return response()->json([
            'status' => 'temp_error'
        ], 200);
    }
     /** =================IMAGE HANDLING =================*/

}
