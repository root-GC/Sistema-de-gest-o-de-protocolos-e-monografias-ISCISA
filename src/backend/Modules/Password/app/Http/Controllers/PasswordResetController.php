<?php

namespace Modules\Password\app\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Modules\Password\app\Services\PasswordResetService;
use Modules\User\app\Models\User;

class PasswordResetController extends Controller
{
    public function __construct(private PasswordResetService $service) {}

    /**
     * Passo 1 — enviar link de reset por email.
     */
    public function forgot(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        $user = User::where('email', $request->email)
            ->where('status', 'active')
            ->first();

        // Resposta genérica — não revelar se o email existe (segurança)
        if (! $user) {
            return response()->json([
                'message' => 'Se o email existir, receberá um link em breve.',
            ]);
        }

        $this->service->sendResetLink($user);

        return response()->json([
            'message' => 'Se o email existir, receberá um link em breve.',
        ]);
    }

    /**
     * Passo 2 — validar token (opcional, para feedback no frontend).
     */
    public function validate(Request $request)
    {
        $request->validate(['token' => ['required', 'string']]);

        $valid = $this->service->tokenIsValid($request->token);

        return response()->json(['valid' => $valid]);
    }

    /**
     * Passo 3 — redefinir a password.
     */
    public function reset(Request $request)
    {
        $request->validate([
            'token'                 => ['required', 'string'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $this->service->getUserByToken($request->token);

        if (! $user) {
            throw ValidationException::withMessages([
                'token' => ['Token inválido ou expirado.'],
            ]);
        }

        $user->update(['password' => Hash::make($request->password)]);

        // Revogar todos os tokens activos após reset
        $user->tokens()->delete();

        $this->service->deleteToken($request->token);

        return response()->json(['message' => 'Palavra-passe actualizada com sucesso.']);
    }
}