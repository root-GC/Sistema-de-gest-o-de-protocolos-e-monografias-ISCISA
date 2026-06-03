<?php

namespace Modules\Auth\app\Services;

use Modules\User\app\Models\User;

class TokenService
{
    /**
     * Revoga tokens anteriores e cria um novo.
     * Devolve o plain text token para o frontend.
     */
    public function create(User $user): string
    {
        // Revogar tokens existentes (uma sessão activa por vez)
        $user->tokens()->delete();

        return $user->createToken('sgpmc-auth')->plainTextToken;
    }

    public function revoke(User $user): void
    {
        $user->currentAccessToken()->delete();
    }
}