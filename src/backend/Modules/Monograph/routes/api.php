<?php

use Illuminate\Support\Facades\Route;
use Modules\Monograph\Http\Controllers\MonographController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('monographs', MonographController::class)->names('monograph');
});
