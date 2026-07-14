<?php

use Illuminate\Support\Facades\Route;
use Modules\Organization\app\Http\Controllers\OrganizationController;
use Modules\Organization\app\Http\Controllers\ScientificAreaController;
use Modules\Organization\app\Http\Controllers\CourseController;


Route::middleware(['auth:sanctum'])->prefix('api/v1')->group(function () {
    Route::apiResource('organizations', OrganizationController::class)->names('organization');

     // Scientific Areas Routes
    Route::apiResource('scientific-areas', ScientificAreaController::class);
    Route::get('scientific-areas/search', [ScientificAreaController::class, 'search']);
    
    // Courses Routes
    Route::apiResource('courses', CourseController::class);
    Route::get('courses/search', [CourseController::class, 'search']);
    Route::get('courses/code/{code}', [CourseController::class, 'getByCode']);
});
