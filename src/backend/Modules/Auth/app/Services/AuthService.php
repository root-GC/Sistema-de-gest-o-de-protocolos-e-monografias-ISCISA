<?php

namespace Modules\Auth\app\Services;

use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Modules\User\app\Models\User;
use Modules\User\app\Models\AdminProfile;
use Modules\User\app\Models\StudentProfile;
use Modules\User\app\Models\TeacherProfile;
use Modules\User\app\Models\CoordinatorProfile;
use Modules\User\app\Models\SecretaryProfile;
use Illuminate\Support\Facades\Log;


class AuthService
{
    /**
     * Valida email + password e devolve o User.
     * Lança ValidationException (HTTP 422) se inválido —
     * o Laravel converte automaticamente para JSON.
     */
   public function attempt(string $email, string $password): User
{
    Log::info('[AUTH]', ['step' => '1']);

    $user = User::where('email', $email)
        ->where('status', 'active')
        ->first();

    Log::info('[AUTH]', [
        'step' => '2',
        'user_found' => $user !== null,
    ]);

    if (! $user) {
        throw ValidationException::withMessages([
            'email' => ['Credenciais inválidas.'],
        ]);
    }

    Log::info('[AUTH]', ['step' => '3']);

    $ok = Hash::check($password, $user->password);

    Log::info('[AUTH]', [
        'step' => '4',
        'password_ok' => $ok,
    ]);

    if (! $ok) {
        throw ValidationException::withMessages([
            'email' => ['Password inválida.'],
        ]);
    }

    Log::info('[AUTH]', ['step' => '5']);

    return $user;
}
}