<?php

namespace Modules\Auth\Http\Controllers;

use Illuminate\Routing\Controller;
use Modules\Auth\Http\Requests\ResetPasswordRequest;
use Modules\Auth\Services\PasswordService;

class ResetPasswordController extends Controller
{
    public function __construct(private PasswordService $passwordService) {}

    public function __invoke(ResetPasswordRequest $request)
    {
        $this->passwordService->reset(
            $request->email,
            $request->token,
            $request->password,
        );

        return response()->json([
            'message' => 'Palavra-passe actualizada. Pode fazer login.',
        ]);
    }
}