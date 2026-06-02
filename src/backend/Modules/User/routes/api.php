<?php

use Illuminate\Support\Facades\Route;
use Modules\User\Http\Controllers\UserController;
use Modules\User\Http\Controllers\ProfileController;

Route::prefix('api')->middleware('auth:sanctum')->name('users.')->group(function () {

    // Gestão de utilizadores — só admin
    Route::middleware('permission:admin.users')->group(function () {
        Route::get('users',            [UserController::class, 'index']);
        Route::post('users',           [UserController::class, 'store']);
        Route::get('users/{id}',       [UserController::class, 'show']);
        Route::put('users/{id}',       [UserController::class, 'update']);
        Route::delete('users/{id}',    [UserController::class, 'destroy']);
        Route::post('users/{id}/roles',[UserController::class, 'assignRoles']);
    });

    // Perfil próprio — qualquer utilizador autenticado
    Route::get('profile',  [ProfileController::class, 'show']);
    Route::put('profile',  [ProfileController::class, 'update']);
});