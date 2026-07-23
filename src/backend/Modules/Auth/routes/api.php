<?php

use Illuminate\Support\Facades\Route;
use Modules\Auth\app\Http\Controllers\DashboardController;
use Modules\Auth\app\Http\Controllers\LoginController;
use Modules\Auth\app\Http\Controllers\LogoutController;
use Modules\Auth\app\Http\Controllers\MeController;
use Modules\Auth\app\Http\Controllers\RegisterController;
use Modules\Auth\app\Http\Controllers\VerifyOtpController;
use Modules\Auth\app\Http\Controllers\ResendOtpController;
use Modules\Auth\app\Http\Controllers\ResetPasswordController;
use Modules\Auth\app\Http\Controllers\RegistrationDataController;
use Modules\Auth\app\Http\Controllers\ForgotPasswordController;
use Modules\Auth\app\Http\Controllers\SetPasswordController;

// 🆕 Admin controllers
use Modules\Auth\app\Http\Controllers\Admin\AdminUserController;
use Modules\Auth\app\Http\Controllers\Admin\AdminOrganController;
use Modules\Auth\app\Http\Controllers\Admin\RoleController;
use Modules\Auth\app\Http\Controllers\Admin\PermissionController;

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
    Route::post('/set-password', SetPasswordController::class);

    // Protegidas
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', MeController::class);
        Route::post('/dashboard', [DashboardController::class, 'index']);
        Route::post('/logout', LogoutController::class);
    });
});

Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('/login', LoginController::class);
    Route::post('/register', RegisterController::class);
    Route::post('/verify-otp', VerifyOtpController::class);
    Route::post('/resend-otp', ResendOtpController::class);
    Route::post('/password/forgot', ForgotPasswordController::class);
    Route::post('/password/reset', ResetPasswordController::class);

    Route::get('/register/courses', [RegistrationDataController::class, 'courses']);
    Route::get('/register/scientific-areas', [RegistrationDataController::class, 'scientificAreas']);
    Route::get('/register/supervisors', [RegistrationDataController::class, 'supervisors']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', LogoutController::class)->name('logout');
        Route::get('me', MeController::class)->name('me');
    });
});

// ── Admin Técnico ────────────────────────────────────────────
Route::prefix('api/v1/admin')->middleware(['auth:sanctum'])->group(function () {
    
    // 🆕 Rotas específicas PRIMEIRO
    Route::post('users/admins', [AdminUserController::class, 'invite']);
    
    // Users — CRUD
    Route::get('users', [AdminUserController::class, 'index']);
    Route::post('users', [AdminUserController::class, 'store']);
    Route::get('users/{id}', [AdminUserController::class, 'show']);
    Route::put('users/{id}', [AdminUserController::class, 'update']);
    Route::delete('users/{id}', [AdminUserController::class, 'destroy']);
    
    // 🆕 Organs — Listar e ver
    Route::get('organs', [AdminOrganController::class, 'index']);
    Route::get('organs/{id}', [AdminOrganController::class, 'show']);
    
    // Roles
    Route::get('roles', [RoleController::class, 'index']);
    Route::get('roles/{id}', [RoleController::class, 'show']);
    Route::post('roles', [RoleController::class, 'store']);
    Route::put('roles/{id}', [RoleController::class, 'update']);
    Route::delete('roles/{id}', [RoleController::class, 'destroy']);
    
    // Permissions
    Route::get('permissions', [PermissionController::class, 'index']);
    Route::post('permissions', [PermissionController::class, 'store']);
    Route::put('permissions/{id}', [PermissionController::class, 'update']);
    Route::delete('permissions/{id}', [PermissionController::class, 'destroy']);
});