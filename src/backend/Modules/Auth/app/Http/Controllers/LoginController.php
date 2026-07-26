<?php

namespace Modules\Auth\app\Http\Controllers;

use Illuminate\Routing\Controller;
use Modules\Auth\app\Http\Requests\LoginHttpRequest;
use Modules\Auth\app\Services\AuthService;
use Modules\Auth\app\Builders\AuthPayloadBuilder;
use Modules\Auth\app\Events\UserLoggedIn;
use Modules\Auth\app\Services\TokenService;
use Illuminate\Support\Facades\Log;
use Modules\User\app\Models\User;
use Modules\User\app\Repositories\UserRepository;
use Modules\User\app\Models\AdminProfile;
use Modules\User\app\Models\StudentProfile;
use Modules\User\app\Models\TeacherProfile;
use Modules\User\app\Models\CoordinatorProfile;
use Modules\User\app\Models\SecretaryProfile;


class LoginController extends Controller
{
    public function __construct(
        private AuthService        $authService,
        private AuthPayloadBuilder $payloadBuilder,
        private TokenService       $tokenService,
    ) {}

    public function __invoke(LoginHttpRequest $request)
    {

//         Log::info('CHEGOU AO CONTROLLER', [
//         'email' => $request->email,
//         'password' => $request->password,
//     ]);

//     Log::info('LOGIN HIT', [
//     'method' => request()->method(),
//     'uri' => request()->getRequestUri(),
// ]);
//         Log::info('LOGIN HIT');

//     return response()->json([
//         'ok' => true,
//         'message' => 'LOGIN FUNCIONA'
//     ]);
        // return response()->json([
        //     'ok' => true,
        //     'time' => microtime(true),
        // ]);

        Log::info('[LOGIN]', [
            'step' => 'controller_hit',
        ]);

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