<?php

use Illuminate\Support\Facades\Route;
use Modules\Password\Http\Controllers\PasswordController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('passwords', PasswordController::class)->names('password');
});
