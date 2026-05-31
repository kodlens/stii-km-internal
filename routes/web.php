<?php

use Illuminate\Support\Facades\Route;


Route::middleware(['auth'])->group(function () {
    /*
    |--------------------------------------------------------------------------
    | KNOWLEDGE MANAGEMENT FACE
    |--------------------------------------------------------------------------
    */
    Route::get('/', [\App\Http\Controllers\PublicFace\WelcomeController::class, 'index'])->name('user.welcome');
    Route::get('/result', [\App\Http\Controllers\PublicFace\ResultController::class, 'index'])->name('user.result');
    Route::get('/get-result', [\App\Http\Controllers\PublicFace\ResultController::class, 'getSearch'])->name('user.result.search');


    Route::get('/load-categories', [\App\Http\Controllers\OpenController::class, 'loadCategories']);
    Route::get('/load-categories-with-paginate', [\App\Http\Controllers\OpenController::class, 'loadCategoriesWithPaginate']);


    Route::post('/docs/temp-upload', [\App\Http\Controllers\UploadController::class, 'tempUpload']);
    Route::post('/docs/temp-remove/{fileName}', [\App\Http\Controllers\UploadController::class, 'removeUpload']);

    Route::get('/docs/pdf-text/{path}', [\App\Http\Controllers\UploadController::class, 'parsePdfDigital']);

    //load topics by category
    Route::get('/load-topics/{catId}', [App\Http\Controllers\OpenController::class, 'getTopicsWithParams'])->name('open.topics-with-params');
    //Route::get('/get-subject-headings/{subjectId}', [App\Http\Controllers\OpenController::class, 'getSubjectHeadingsWithParams'])->name('open.subject-headings-with-params');

});



Route::middleware(['auth', 'role:admin'])->group(function () {


    Route::get('/admin/dashboard', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'index'])->name('admin.dashboard');

    Route::resource('/admin/categories', \App\Http\Controllers\Admin\AdminCategoryController::class)->names('admin.categories');
    Route::get('/admin/get-categories', [\App\Http\Controllers\Admin\AdminCategoryController::class, 'getData'])->name('admin.categories.getData');

    Route::resource('/admin/topics', \App\Http\Controllers\Admin\AdminTopicController::class)->names('admin.topics');
    Route::get('/admin/get-topics', [\App\Http\Controllers\Admin\AdminTopicController::class, 'getData'])->name('admin.topics.getData');


});




Route::middleware(['auth', 'role:encoder'])->group(function () {

    Route::get('/encoder/dashboard', [\App\Http\Controllers\Encoder\EncoderDashboardController::class, 'index'])->name('encoder.dashboard');

    Route::get('/encoder/materials/all-materials', [\App\Http\Controllers\Encoder\EncoderAllMaterialController::class, 'index'])->name('encoder.all-materials.index');
    Route::delete('/encoder/materials/all-materials/{id}', [\App\Http\Controllers\Encoder\EncoderAllMaterialController::class, 'destroy'])->name('encoder.all-materials.delete');
    Route::get('/encoder/materials/get-all-materials', [\App\Http\Controllers\Encoder\EncoderAllMaterialController::class, 'getData'])->name('encoder.all-materials.get-data');

    Route::get('/encoder/materials/drafted-materials', [\App\Http\Controllers\Encoder\EncoderDraftMaterialController::class, 'index'])->name('encoder.drafted-materials-index');
    Route::get('/encoder/materials/get-drafted-materials', [\App\Http\Controllers\Encoder\EncoderDraftMaterialController::class, 'getData'])->name('encoder.get-drafted-materials-index');

    Route::get('/encoder/materials/submitted-materials', [\App\Http\Controllers\Encoder\EncoderSubmitMaterialController::class, 'index'])->name('encoder.submitted-materials-index');
    Route::get('/encoder/materials/get-submitted-materials', [\App\Http\Controllers\Encoder\EncoderSubmitMaterialController::class, 'getData'])->name('encoder.get-submitted-materials-index');


    Route::get('/encoder/materials/published-materials', [\App\Http\Controllers\Encoder\EncoderPublishMaterialController::class, 'index'])->name('encoder.published-materials-index');
    Route::get('/encoder/materials/get-published-materials', [\App\Http\Controllers\Encoder\EncoderPublishMaterialController::class, 'getData'])->name('encoder.get-published-materials-index');


    Route::resource('/encoder/materials/new-material', \App\Http\Controllers\Encoder\EncoderNewMaterialController::class)->names('encoder.new-material');

});




require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
