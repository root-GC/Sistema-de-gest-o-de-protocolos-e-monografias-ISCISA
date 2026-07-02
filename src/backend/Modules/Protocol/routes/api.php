<?php

use Illuminate\Support\Facades\Route;
use Modules\Protocol\app\Http\Controllers\TopicController;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('topics', [TopicController::class, 'store'])->name('topic.store');
    Route::get('topics', [TopicController::class, 'index'])->name('topic.index');

    Route::apiResource('protocols', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolController')->names('protocol');
});
