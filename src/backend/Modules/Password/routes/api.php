<?php
// Modules/Password/Routes/api.php
use Illuminate\Support\Facades\Route;
use Modules\Password\app\Http\Controllers\PasswordResetController;

Route::prefix('api/password')->name('password.')->group(function () {
    Route::post('forgot',   [PasswordResetController::class, 'forgot'])->name('forgot');
    Route::post('validate', [PasswordResetController::class, 'validate'])->name('validate');
    Route::post('reset',    [PasswordResetController::class, 'reset'])->name('reset');
});