<?php

use Illuminate\Support\Facades\Route;
use Modules\Protocol\app\Http\Controllers\TopicController;

Route::prefix('api/v1')->middleware(['auth:sanctum'])->group(function () {
    Route::post('topics', [TopicController::class, 'store'])->name('topic.store');
    Route::get('topics', [TopicController::class, 'index'])->name('topic.index');

    Route::patch('topics/{topic}/supervisor-approve', [TopicController::class, 'approveBySupervisor'])->name('topic.approve');
    Route::patch('topics/{topic}/supervisor-reject', [TopicController::class, 'rejectBySupervisor'])->name('topic.reject');
    Route::apiResource('protocols', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolController')->names('protocol');
});
