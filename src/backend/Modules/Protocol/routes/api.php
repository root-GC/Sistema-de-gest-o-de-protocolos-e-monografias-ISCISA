<?php

use Illuminate\Support\Facades\Route;
use Modules\Protocol\app\Http\Controllers\TopicController;

Route::prefix('api/v1')->middleware(['api', 'auth:sanctum'])->group(function () {
    Route::post('topics', [TopicController::class, 'store'])->name('topic.store');
    Route::get('topics', [TopicController::class, 'index'])->name('topic.index');

    Route::patch('topics/{topic}/supervisor-approve', [TopicController::class, 'approveBySupervisor'])->name('topic.approve');
    Route::patch('topics/{topic}/supervisor-reject', [TopicController::class, 'rejectBySupervisor'])->name('topic.reject');
    Route::get('supervisor/topics', [TopicController::class, 'getForSupervisor'])->name('supervisor.topics.list');

    // Secretary operations: list topics for assignment, get eligible reviewers, assign reviewers
    Route::get('secretary/topics', [TopicController::class, 'getForSecretary'])->name('secretary.topics.list');
    Route::get('topics/{topic}/eligible-reviewers', [TopicController::class, 'getEligibleReviewers'])->name('topic.eligible-reviewers');
    Route::post('topics/{topic}/assign-reviewers', [TopicController::class, 'assignReviewers'])->name('topic.assign-reviewers');
    Route::get('reviewer/topics', [TopicController::class, 'getForReviewer'])->name('reviewer.topics.list');
    Route::get('topics/{topic}/comments', [TopicController::class, 'getComments'])->name('topic.comments.index');
    Route::post('topics/{topic}/comments', [TopicController::class, 'submitComment'])->name('topic.comments.store');
    Route::post('topics/{topic}/evaluations', [TopicController::class, 'submitEvaluation'])->name('topic.evaluations.store');

    Route::apiResource('protocols', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolController')->names('protocol');
});
