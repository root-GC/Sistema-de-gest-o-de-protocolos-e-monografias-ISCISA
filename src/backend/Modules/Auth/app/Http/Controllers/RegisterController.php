<?php

// namespace Modules\Auth\Http\Controllers;

// use Illuminate\Routing\Controller;
// use Modules\Auth\Builders\AuthPayloadBuilder;
// use Modules\Auth\Events\UserRegistered;
// use Modules\Auth\Http\Requests\RegisterRequest;
// use Modules\Auth\Services\RegisterService;
// use Modules\Auth\Services\TokenService;

// class RegisterController extends Controller
// {
//     public function __construct(
//         private RegisterService    $registerService,
//         private TokenService       $tokenService,
//         private AuthPayloadBuilder $payloadBuilder,
//     ) {}

//     public function __invoke(RegisterRequest $request)
//     {
//         $user  = $this->registerService->register($request->validated());
//         $token = $this->tokenService->create($user);

//         event(new UserRegistered($user));

//         return response()->json([
//             'message' => 'Registo efectuado com sucesso.',
//             'token'   => $token,
//             'user'    => $this->payloadBuilder->build($user),
//         ], 201);
//     }
// }