<?php

namespace Modules\Auth\app\Http\Controllers;

use Illuminate\Routing\Controller;
use Modules\Auth\app\Http\Requests\LoginHttpRequest;
use Modules\Auth\app\Services\AuthService;
use Modules\Auth\app\Builders\AuthPayloadBuilder;
use Modules\Auth\app\Events\UserLoggedIn;
use Modules\Auth\app\Services\TokenService;

class LoginController extends Controller
{
    public function __construct(
        private AuthService        $authService,
        private AuthPayloadBuilder $payloadBuilder,
        private TokenService       $tokenService,
    ) {}

    public function __invoke(LoginHttpRequest $request)
    {
        $user = $this->authService->attempt(
            $request->email,
            $request->password
        );

        $token = $this->tokenService->create($user);

        event(new UserLoggedIn($user));

        return response()->json([
            'message' => 'Login efectuado com sucesso.',
            'token'   => $token,
            'user'    => $this->payloadBuilder->build($user),
        ]);
    }
}