<?php

namespace Modules\Auth\app\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Auth\app\Http\Requests\ForgotPasswordRequest;
use Modules\Auth\app\Services\PasswordService;

class ForgotPasswordController extends Controller
{
    public function __construct(private PasswordService $passwordService) {}

    public function __invoke(ForgotPasswordRequest $request)
    {
        // Resposta sempre igual — não revelar se o email existe
        $this->passwordService->sendResetLink($request->email);

        return response()->json([
            'message' => 'Se o email existir na nossa base de dados, receberá um link em breve.',
        ]);
    }

    public function validateToken(Request $request, PasswordService $passwordService)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
        ]);

        $seconds = $passwordService->secondsRemaining($request->email, $request->token);

        return response()->json([
            'valid' => $seconds !== null && $seconds > 0,
            'seconds_remaining' => $seconds ?? 0,
        ]);
    }
}