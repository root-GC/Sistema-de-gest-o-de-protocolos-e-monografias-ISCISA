<?php

namespace Modules\Auth\app\Http\Controllers;

use Illuminate\Routing\Controller;
use Modules\Auth\app\Http\Requests\ResendOtpRequest;
use Modules\Auth\app\Services\OtpService;

class ResendOtpController extends Controller
{
    public function __construct(private OtpService $otpService) {}

    public function __invoke(ResendOtpRequest $request)
    {
        $this->otpService->generateAndSend($request->email, 'register');

        return response()->json([
            'message' => 'Novo código enviado para o seu email.',
        ]);
    }
}