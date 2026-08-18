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
use Modules\Auth\app\Http\Controllers\Admin\AdminCoordinatorController;
use Modules\Auth\app\Http\Controllers\Admin\AdminSecretaryController;
use Modules\Auth\app\Http\Controllers\Admin\AdminTeacherController;
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

     // ── Reset password ───────────────────────────────────────────────
    //Timer reset password
    Route::get('/reset-password/validate', [ForgotPasswordController::class, 'validateToken']);

    // routes/api.php (módulo Auth)
    // Rota para verificar o status do OTP (tempo restante e cooldown)
    Route::get('/otp/status', [VerifyOtpController::class, 'status']);
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

// ── Admin Técnico / Executivo ────────────────────────────────────────────
Route::prefix('api/v1')->middleware(['auth:sanctum'])->group(function () {

    // 🆕 Rotas específicas PRIMEIRO
    // ⚠️ AdminUserController::invite() já não existe — foi absorvido pelo
    // store() com o duplo portão (Técnico → Direção Científica → outros 3).
    // Deixei comentado em vez de apagar, como pediste. Descomenta só depois
    // de repormos um método invite() (ex: alias de store()) no controller.
    // Route::post('users/admins', [AdminUserController::class, 'invite']);

    // Users (executivos) — CRUD
    Route::get('users', [AdminUserController::class, 'index']);
    Route::post('users', [AdminUserController::class, 'store']);
    Route::get('users/{id}', [AdminUserController::class, 'show']);
    Route::put('users/{id}', [AdminUserController::class, 'update']);
    Route::delete('users/{id}', [AdminUserController::class, 'destroy']);

    // 🆕 Organs — Listar e ver
    Route::get('organs', [AdminOrganController::class, 'index']);
    Route::get('organs/{id}', [AdminOrganController::class, 'show']);

    // 🆕 Coordenadores — só o executivo da Direção Científica (gate no controller)
    Route::get('coordinators', [AdminCoordinatorController::class, 'index']);
    Route::post('coordinators', [AdminCoordinatorController::class, 'store']);
    Route::put('coordinators/{id}', [AdminCoordinatorController::class, 'update']);
    Route::delete('coordinators/{id}', [AdminCoordinatorController::class, 'destroy']);

    // 🆕 Secretárias — cada executivo gere as do seu próprio órgão (gate no controller)
    Route::get('secretaries', [AdminSecretaryController::class, 'index']);
    Route::post('secretaries', [AdminSecretaryController::class, 'store']);
    Route::put('secretaries/{id}', [AdminSecretaryController::class, 'update']);
    Route::delete('secretaries/{id}', [AdminSecretaryController::class, 'destroy']);
    Route::post('secretaries/{id}/permissions', [AdminSecretaryController::class, 'grantPermission']);
    Route::delete('secretaries/{id}/permissions/{code}', [AdminSecretaryController::class, 'revokePermission']);

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


    // routes/api.php (grupo admin, middleware auth:sanctum + role:admin ou equivalente que já usas)
    Route::prefix('admin/teachers')->group(function () {
        Route::get('/',            [AdminTeacherController::class, 'index']);
        Route::post('/',           [AdminTeacherController::class, 'store']);
        Route::post('/import',     [AdminTeacherController::class, 'import']);
        Route::put('/{id}',        [AdminTeacherController::class, 'update']);
        Route::delete('/{id}',     [AdminTeacherController::class, 'destroy']);
    });

   
});