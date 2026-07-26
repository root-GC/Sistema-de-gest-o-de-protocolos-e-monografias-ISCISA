<?php

use Illuminate\Support\Facades\Route;
use Modules\Password\Http\Controllers\PasswordController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('passwords', PasswordController::class)->names('password');
});
