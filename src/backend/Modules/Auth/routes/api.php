<?php

use Illuminate\Support\Facades\Route;
use Modules\Auth\app\Http\Controllers\LoginController;
use Modules\Auth\app\Http\Controllers\LogoutController;
use Modules\Auth\app\Http\Controllers\MeController;
use Modules\Auth\app\Http\Controllers\RegisterController;
use Modules\Auth\app\Http\Controllers\VerifyOtpController;
use Modules\Auth\app\Http\Controllers\ResendOtpController;
use Modules\Auth\app\Http\Controllers\ResetPasswordController;
use Modules\Auth\app\Http\Controllers\RegistrationDataController;
use Modules\Auth\app\Http\Controllers\ForgotPasswordController;


// Dados para formulário de registro (público)
Route::prefix('api/register')->group(function () {
    Route::get('scientific-areas', [RegistrationDataController::class, 'scientificAreas']);
    Route::get('courses', [RegistrationDataController::class, 'courses']);
    Route::get('supervisors', [RegistrationDataController::class, 'supervisors']);
});

Route::prefix('api')->group(function () {
 // Públicas
    Route::post('/login', LoginController::class);
    Route::post('/register', RegisterController::class);
    Route::post('/verify-otp', VerifyOtpController::class);
    Route::post('/resend-otp', ResendOtpController::class);
    Route::post('/password/forgot', ForgotPasswordController::class);
    Route::post('/password/reset', ResetPasswordController::class);
});

Route::prefix('auth')->name('auth.')->group(function () {

    // Públicas
    Route::post('/login', LoginController::class);
    Route::post('/register', RegisterController::class);
    Route::post('/verify-otp', VerifyOtpController::class);
    Route::post('/resend-otp', ResendOtpController::class);
    Route::post('/password/forgot', ForgotPasswordController::class);
    Route::post('/password/reset', ResetPasswordController::class);

    Route::get('/register/courses', [RegistrationDataController::class, 'courses']);
    Route::get('/register/scientific-areas', [RegistrationDataController::class, 'scientificAreas']);
    Route::get('/register/supervisors', [RegistrationDataController::class, 'supervisors']);

    // Protegidas
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('logout', LogoutController::class)
            ->name('logout');

        Route::get('me', MeController::class)
            ->name('me');
    });
});