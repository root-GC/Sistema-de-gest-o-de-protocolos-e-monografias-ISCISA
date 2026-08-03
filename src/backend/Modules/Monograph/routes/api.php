<?php

// Modules/Monograph/routes/api.php
use Illuminate\Support\Facades\Route;
use Modules\Monograph\app\Http\Controllers\MonographController;

Route::prefix('monographs')->middleware(['auth:sanctum'])->group(function () {

    Route::get('/{monograph}', [MonographController::class, 'show']);
    Route::get('/{monograph}/history', [MonographController::class, 'history']);

    Route::post('/{monograph}/submit', [MonographController::class, 'submit'])
        ->middleware('permission:monograph.submit');

    Route::post('/{monograph}/endorse', [MonographController::class, 'endorse'])
        ->middleware('permission:monograph.endorse');

    Route::post('/{monograph}/verify', [MonographController::class, 'verify'])
        ->middleware('permission:monograph.validate');

        Route::post('/{monograph}/comments', [MonographController::class, 'addComment'])
    ->middleware('permission:monograph.comment');
});