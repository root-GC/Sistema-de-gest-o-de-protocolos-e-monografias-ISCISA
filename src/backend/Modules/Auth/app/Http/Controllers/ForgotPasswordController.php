<?php

namespace Modules\Auth\app\Http\Controllers;

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
}