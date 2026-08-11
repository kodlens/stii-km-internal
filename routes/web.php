<?php

use Illuminate\Support\Facades\Route;


    Route::get('/upload-size', function () {
        return response()->json([
            'size' => ini_get('upload_max_filesize'),
            'post_size' => ini_get('post_max_size')
        ]);
    })->name('upload-size');



Route::middleware(['auth'])->group(function () {
    /*
    |--------------------------------------------------------------------------
    | KNOWLEDGE MANAGEMENT FACE
    |--------------------------------------------------------------------------
    */
    Route::get('/', [\App\Http\Controllers\PublicFace\WelcomeController::class, 'index'])->name('user.welcome');
    Route::get('/result', [\App\Http\Controllers\PublicFace\ResultController::class, 'index'])->name('user.result');
    Route::get('/get-result', [\App\Http\Controllers\PublicFace\ResultController::class, 'getSearch'])->name('user.result.search');
    Route::get('/view-material/{filename}', [\App\Http\Controllers\PublicFace\ViewMaterialController::class, 'view'])->name('user.materials.view');
    Route::get('/materials/{filename}', [\App\Http\Controllers\PublicFace\MaterialDocumentController::class, 'show'])->name('user.materials.document');


    Route::get('/load-categories', [\App\Http\Controllers\OpenController::class, 'loadCategories']);
    Route::get('/load-categories-with-paginate', [\App\Http\Controllers\OpenController::class, 'loadCategoriesWithPaginate']);


    Route::post('/docs/temp-upload', [\App\Http\Controllers\UploadController::class, 'tempUpload']);
    Route::post('/docs/temp-remove/{fileName}', [\App\Http\Controllers\UploadController::class, 'removeUpload']);

    Route::get('/docs/pdf-text/{path}', [\App\Http\Controllers\UploadController::class, 'parsePdfDigital']);

    //load topics by category
    //Route::get('/load-topics/{catId}', [App\Http\Controllers\OpenController::class, 'getTopicsWithParams'])->name('open.topics-with-params');
    //Route::get('/get-subject-headings/{subjectId}', [App\Http\Controllers\OpenController::class, 'getSubjectHeadingsWithParams'])->name('open.subject-headings-with-params');


    //only authenticated can use classify-content

    Route::post('/classify-content', [App\Http\Controllers\Base\ClassifyController::class, 'classify'])->name('classify-content');

});



Route::middleware(['auth', 'role:admin'])->group(function () {


    Route::get('/admin/dashboard', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'index'])->name('admin.dashboard');

    Route::resource('/admin/categories', \App\Http\Controllers\Admin\AdminCategoryController::class)->names('admin.categories');
    Route::get('/admin/get-categories', [\App\Http\Controllers\Admin\AdminCategoryController::class, 'getData'])->name('admin.categories.getData');

    Route::resource('/admin/topics', \App\Http\Controllers\Admin\AdminTopicController::class)->names('admin.topics');
    Route::get('/admin/get-topics', [\App\Http\Controllers\Admin\AdminTopicController::class, 'getData'])->name('admin.topics.getData');

    Route::resource('/admin/materials', \App\Http\Controllers\Admin\AdminMaterialController::class)->names('admin.materials');
    Route::get('/admin/get-materials', [\App\Http\Controllers\Admin\AdminMaterialController::class, 'getData'])->name('admin.materials.get-data');

     Route::resource('/admin/ojt-materials', \App\Http\Controllers\Admin\AdminOjtMaterialController::class)->names('admin.ojt-materials');
    Route::get('/admin/get-ojt-materials', [\App\Http\Controllers\Admin\AdminOjtMaterialController::class, 'getData'])->name('admin.ojt-materials.get-data');


    Route::resource('/admin/users', \App\Http\Controllers\Admin\AdminUserController::class)->names('admin.users');
    Route::get('/admin/get-users', [\App\Http\Controllers\Admin\AdminUserController::class, 'getData'])->name('admin.users.get-data');
    Route::post('/admin/users-change-password/{id}', [App\Http\Controllers\Admin\AdminUserController::class, 'changePassword'])->name('admin.users.change-password');
    Route::post('/admin/change-password/{id}', [App\Http\Controllers\Admin\AdminUserController::class, 'changePassword']);

});




Route::middleware(['auth', 'role:encoder'])->group(function () {

    Route::get('/encoder/dashboard', [\App\Http\Controllers\Encoder\EncoderDashboardController::class, 'index'])->name('encoder.dashboard');

    Route::get('/encoder/materials/all-materials', [\App\Http\Controllers\Encoder\EncoderAllMaterialController::class, 'index'])->name('encoder.materials.all-materials.index');
    Route::delete('/encoder/materials/all-materials/{id}', [\App\Http\Controllers\Encoder\EncoderAllMaterialController::class, 'destroy'])->name('encoder.all-materials.delete');
    Route::get('/encoder/materials/get-all-materials', [\App\Http\Controllers\Encoder\EncoderAllMaterialController::class, 'getData'])->name('encoder.all-materials.get-data');

    Route::get('/encoder/materials/drafted-materials', [\App\Http\Controllers\Encoder\EncoderDraftMaterialController::class, 'index'])->name('encoder.drafted-materials-index');
    Route::post('/encoder/materials/set-draft-materials/{id}', [\App\Http\Controllers\Encoder\EncoderDraftMaterialController::class, 'setDraft'])->name('encoder.set-draft-materials');
    Route::get('/encoder/materials/get-drafted-materials', [\App\Http\Controllers\Encoder\EncoderDraftMaterialController::class, 'getData'])->name('encoder.get-drafted-materials-index');

    Route::get('/encoder/materials/submitted-materials', [\App\Http\Controllers\Encoder\EncoderSubmitMaterialController::class, 'index'])->name('encoder.submitted-materials-index');
    Route::post('/encoder/materials/set-submit-materials/{id}', [\App\Http\Controllers\Encoder\EncoderSubmitMaterialController::class, 'setSubmit'])->name('encoder.set-submit-materials');
    Route::get('/encoder/materials/get-submitted-materials', [\App\Http\Controllers\Encoder\EncoderSubmitMaterialController::class, 'getData'])->name('encoder.get-submitted-materials-index');


    Route::get('/encoder/materials/published-materials', [\App\Http\Controllers\Encoder\EncoderPublishMaterialController::class, 'index'])->name('encoder.published-materials-index');
    Route::get('/encoder/materials/get-published-materials', [\App\Http\Controllers\Encoder\EncoderPublishMaterialController::class, 'getData'])->name('encoder.get-published-materials-index');


    Route::resource('/encoder/materials/new-material', \App\Http\Controllers\Encoder\EncoderNewMaterialController::class)->names('encoder.new-material');


});



Route::middleware(['auth', 'role:publisher'])->group(function () {

    Route::get('/publisher/dashboard', [\App\Http\Controllers\Publisher\PublisherDashboardController::class, 'index'])->name('publisher.dashboard');

    Route::get('/publisher/materials/submitted-materials', [\App\Http\Controllers\Publisher\PublisherSubmittedMaterialController::class, 'index'])->name('publisher.materials.submitted-materials.index');
    Route::get('/publisher/materials/get-submitted-materials', [\App\Http\Controllers\Publisher\PublisherSubmittedMaterialController::class, 'getData'])->name('publisher.materials.submitted-materials.getData');


    Route::get('/publisher/materials/published-materials', [\App\Http\Controllers\Publisher\PublisherPublishedMaterialController::class, 'index'])->name('publisher.materials.published-materials.index');
    Route::get('/publisher/materials/get-published-materials', [\App\Http\Controllers\Publisher\PublisherPublishedMaterialController::class, 'getData'])->name('publisher.materials.published-materials.get-data');


    Route::get('/publisher/materials/new-material/create', [\App\Http\Controllers\Publisher\PublisherNewMaterialController::class, 'index'])->name('publisher.materials.new-material.index');
    Route::get('/publisher/materials/new-material/{id}/edit', [\App\Http\Controllers\Publisher\PublisherNewMaterialController::class, 'edit'])->name('publisher.materials.new-material.edit');
    Route::post('/publisher/materials/new-material', [\App\Http\Controllers\Publisher\PublisherNewMaterialController::class, 'store'])->name('publisher.materials.new-material.store');
    Route::post('/publisher/materials/new-material/{id}', [\App\Http\Controllers\Publisher\PublisherNewMaterialController::class, 'update'])->name('publisher.materials.new-material.update');

    Route::post('/publisher/materials/set-publish-materials/{id}', [\App\Http\Controllers\Publisher\PublisherNewMaterialController::class, 'setPublish'])->name('publisher.set-publish-materials');


});



require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
