<?php

use Illuminate\Support\Facades\Route;
use Modules\Auth\app\Http\Controllers\LoginController;
use Modules\Auth\app\Http\Controllers\LogoutController;
use Modules\Auth\app\Http\Controllers\MeController;

/*
|--------------------------------------------------------------------------
| Auth Module — API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('api')->name('auth.')->group(function () {

    // Públicas
    Route::post('login',  LoginController::class)->name('login');

    // Protegidas por Sanctum
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', LogoutController::class)->name('logout');
        Route::get('me',      MeController::class)->name('me');
    });
});