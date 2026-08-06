<?php

use Illuminate\Support\Facades\Route;
use Modules\User\app\Http\Controllers\UserController;
use Modules\User\app\Http\Controllers\ProfileController;

    // Perfil próprio — qualquer utilizador autenticado
    Route::get('profile',  [ProfileController::class, 'show']);
    Route::put('profile',  [ProfileController::class, 'update']);
// });