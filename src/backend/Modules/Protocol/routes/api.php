<?php

use Illuminate\Support\Facades\Route;
use Modules\Protocol\Http\Controllers\ProtocolController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('protocols', ProtocolController::class)->names('protocol');
});
