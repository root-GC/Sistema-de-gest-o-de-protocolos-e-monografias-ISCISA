<?php

namespace Modules\Auth\app\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Modules\Auth\app\Http\Requests\SetPasswordRequest;

class SetPasswordController extends Controller
{
    public function __invoke(SetPasswordRequest $request)
    {
        $status = Password::broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password'            => Hash::make($password),
                    'status'              => 'active',
                    'must_reset_password' => false,
                ])->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Link inválido ou expirado. Peça um novo link para definir a senha.'], 422);
        }

        return response()->json(['message' => 'Senha definida com sucesso. Pode agora iniciar sessão.']);
    }
}
