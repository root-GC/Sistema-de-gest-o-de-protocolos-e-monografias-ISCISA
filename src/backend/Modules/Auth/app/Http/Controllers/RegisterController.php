<?php

namespace Modules\Auth\app\Http\Controllers;

use Illuminate\Routing\Controller;
use Modules\Auth\app\Http\Requests\RegisterRequest;
use Modules\Auth\app\Services\RegisterService;

class RegisterController extends Controller
{
    public function __construct(private RegisterService $registerService) {}

    public function __invoke(RegisterRequest $request)
    {
        $user = $this->registerService->register($request->validated());

        return response()->json([
            'message' => 'Registo criado com sucesso. Verifique o código enviado para o seu email para activar a conta.',
            'email'   => $user->email,
        ], 201);
    }
}