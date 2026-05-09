<?php

use Illuminate\Support\Facades\Route;
use Modules\Defense\Http\Controllers\DefenseController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('defenses', DefenseController::class)->names('defense');
});
