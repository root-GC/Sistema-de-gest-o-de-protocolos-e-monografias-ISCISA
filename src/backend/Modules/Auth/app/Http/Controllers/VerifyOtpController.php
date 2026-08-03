<?php

namespace Modules\Auth\app\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Auth\app\Builders\AuthPayloadBuilder;
use Modules\Auth\app\Http\Requests\VerifyOtpRequest;
use Modules\Auth\app\Services\OtpService;
use Modules\Auth\app\Services\TokenService;
use Modules\User\app\Models\User;

class VerifyOtpController extends Controller
{
    public function __construct(
        private OtpService         $otpService,
        private TokenService       $tokenService,
        private AuthPayloadBuilder $payloadBuilder,
    ) {}

    public function __invoke(VerifyOtpRequest $request)
    {
        $this->otpService->verify($request->email, $request->code, 'register');

        $user = User::where('email', $request->email)->firstOrFail();
        $user->forceFill([
            'email_verified_at' => now(),
            'status'            => 'active',
        ])->save();

        $token = $this->tokenService->create($user);

        return response()->json([
            'message' => 'Email verificado com sucesso.',
            'token'   => $token,
            'user'    => $this->payloadBuilder->build($user),
        ]);
    }

    // OtpController.php (ou onde já tratas o verifyOtp/resendOtp)

public function status(Request $request, OtpService $otpService)
{
    $request->validate([
        'email'   => ['required', 'email'],
        'purpose' => ['nullable', 'string'],
    ]);

    $purpose = $request->purpose ?? 'register';

    return response()->json([
        'seconds_remaining' => $otpService->secondsRemaining($request->email, $purpose),
        'resend_cooldown'   => $otpService->resendCooldownRemaining($request->email, $purpose),
    ]);
}
}