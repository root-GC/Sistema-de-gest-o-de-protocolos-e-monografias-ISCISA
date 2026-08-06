<?php

use Illuminate\Support\Facades\Route;
use Modules\Organization\app\Http\Controllers\OrganizationController;
use Modules\Organization\app\Http\Controllers\ScientificAreaController;
use Modules\Organization\app\Http\Controllers\CourseController;
use Modules\Organization\app\Http\Controllers\OrganController;
use Modules\Organization\app\Http\Controllers\OrganMemberController;

Route::middleware(['auth:sanctum'])->prefix('api/v1')->group(function () {
    // Organs Routes
    Route::apiResource('organs', OrganController::class)->names('organ');

    Route::apiResource('organizations', OrganizationController::class)->names('organization');

    // Scientific Areas Routes
    Route::apiResource('scientific-areas', ScientificAreaController::class);
    Route::get('scientific-areas/search', [ScientificAreaController::class, 'search']);
    
    // Courses Routes
    Route::apiResource('courses', CourseController::class);
    Route::get('courses/search', [CourseController::class, 'search']);
    Route::get('courses/code/{code}', [CourseController::class, 'getByCode']);

    // ── Organ Members (Presidentes de órgão gerem os seus membros) ─────
    // CORREÇÃO: Adicionar o prefixo 'organ-members' ao grupo
    Route::prefix('organ-members')->group(function () {
        Route::get('/', [OrganMemberController::class, 'index']);
        Route::get('/available-teachers', [OrganMemberController::class, 'availableTeachers']);
        Route::post('/invite', [OrganMemberController::class, 'invite']);
        Route::get('/{id}', [OrganMemberController::class, 'show']);
        Route::put('/{id}', [OrganMemberController::class, 'update']);
        Route::delete('/{id}', [OrganMemberController::class, 'destroy']);
    });

});