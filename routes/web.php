<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('auth/login');
})->name('home');

// Route::middleware(['auth'])->group(function () {
//     Route::get('dashboard', function () {
//         return Inertia::render('dashboard');
//     })->name('dashboard');
// });



Route::middleware(['auth'])->group(function () {

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

    Route::get('/encoder/materials/all-materials', [\App\Http\Controllers\Encoder\EncoderAllMaterialController::class, 'index'])->name('encoder.all-materials-index');
    Route::get('/encoder/materials/get-all-materials', [\App\Http\Controllers\Encoder\EncoderAllMaterialController::class, 'getData'])->name('encoder.all-materials-index');

    Route::get('/encoder/materials/draft-materials', [\App\Http\Controllers\Encoder\EncoderDraftMaterialController::class, 'index'])->name('encoder.draft-materials-index');
    Route::get('/encoder/materials/get-draft-materials', [\App\Http\Controllers\Encoder\EncoderDraftMaterialController::class, 'getData'])->name('encoder.get-draft-materials-index');

    Route::get('/encoder/materials/submit-materials', [\App\Http\Controllers\Encoder\EncoderSubmitMaterialController::class, 'index'])->name('encoder.submit-materials-index');
    Route::get('/encoder/materials/get-submit-materials', [\App\Http\Controllers\Encoder\EncoderSubmitMaterialController::class, 'getData'])->name('encoder.get-submit-materials-index');


    Route::get('/encoder/materials/publish-materials', [\App\Http\Controllers\Encoder\EncoderPublishMaterialController::class, 'index'])->name('encoder.publish-materials-index');
    Route::get('/encoder/materials/get-publish-materials', [\App\Http\Controllers\Encoder\EncoderPublishMaterialController::class, 'getData'])->name('encoder.get-publish-materials-index');




    Route::get('/encoder/materials/new-material', [\App\Http\Controllers\Encoder\EncoderNewMaterialController::class, 'index'])->name('encoder.new-material.index');
    Route::post('/encoder/materials/new-material', [\App\Http\Controllers\Encoder\EncoderNewMaterialController::class, 'store'])->name('encoder.new-material.store');

});




require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
