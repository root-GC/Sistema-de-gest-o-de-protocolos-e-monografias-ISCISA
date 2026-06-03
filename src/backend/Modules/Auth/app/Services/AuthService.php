<?php

namespace Modules\Auth\app\Services;

use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Modules\User\app\Models\User;

class AuthService
{
    /**
     * Valida email + password e devolve o User.
     * Lança ValidationException (HTTP 422) se inválido —
     * o Laravel converte automaticamente para JSON.
     */
    public function attempt(string $email, string $password): User
    {
        $user = User::where('email', $email)
            ->where('status', 'active')
            ->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciais inválidas ou conta inactiva.'],
            ]);
        }

        return $user;
    }
}