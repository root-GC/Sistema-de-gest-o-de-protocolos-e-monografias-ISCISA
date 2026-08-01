<?php

namespace Modules\Auth\app\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;
use Modules\Auth\app\Http\Requests\ResendOtpRequest;
use Modules\Auth\app\Services\OtpService;

class ResendOtpController extends Controller
{
    public function __construct(private OtpService $otpService) {}

    public function __invoke(ResendOtpRequest $request)
    {
        try {
            $this->otpService->generateAndSend($request->email, 'register');
        } catch (ValidationException $e) {
            $seconds = $this->otpService->resendCooldownRemaining($request->email, 'register');

            return response()->json([
                'message'     => "Aguarde {$seconds} segundos antes de solicitar um novo código.",
                'retry_after' => $seconds, // Deve ser 0-60, não 1374
            ], 429);
        }

        return response()->json([
            'message' => 'Novo código enviado para o seu email.',
        ]);
    }
}