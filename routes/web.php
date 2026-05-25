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




Route::middleware(['auth', 'role:admin'])->group(function () {


    Route::get('/admin/dashboard', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'index'])->name('admin.dashboard.index');

    Route::resource('/admin/categories', \App\Http\Controllers\Admin\AdminCategoryController::class)->names('admin.categories');
    Route::get('/admin/get-categories', [\App\Http\Controllers\Admin\AdminCategoryController::class, 'getData'])->name('admin.dashboard.getData');


});




Route::middleware(['auth', 'role:encoder'])->group(function () {

    Route::get('/encoder/dashboard', [\App\Http\Controllers\Encoder\EncoderDashboardController::class, 'index'])->name('encoder.dashboard');



});




require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
