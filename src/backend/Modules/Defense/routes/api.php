<?php
// Modules/Defense/routes/api.php

use Illuminate\Support\Facades\Route;
use Modules\Defense\app\Http\Controllers\DefenseController;

Route::prefix('defenses')->middleware(['auth:sanctum'])->group(function () {

    Route::get('/{defense}', [DefenseController::class, 'show']);

    Route::post('/{defense}/jury', [DefenseController::class, 'assignJury'])
        ->middleware('permission:defense.jury.assign');

    Route::post('/{defense}/schedule/propose', [DefenseController::class, 'proposeSchedule'])
        ->middleware('permission:defense.schedule');

    Route::post('/{defense}/schedule/respond', [DefenseController::class, 'respondToSchedule']);

    Route::get('/{defense}/schedule/responses', [DefenseController::class, 'scheduleResponses'])
        ->middleware('permission:defense.schedule');

    Route::post('/{defense}/grade', [DefenseController::class, 'recordGrade'])
        ->middleware('permission:defense.grade.record');

    Route::post('/{defense}/minutes', [DefenseController::class, 'uploadMinutes'])
        ->middleware('permission:defense.minutes.upload');

    Route::post('/{defense}/final-document', [DefenseController::class, 'submitFinalDocument']);

    Route::post('/{defense}/final-document/validate', [DefenseController::class, 'validateFinalDocument'])
        ->middleware('permission:defense.grade.record');
});