<?php

namespace Modules\Auth\App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;

use Modules\Auth\App\Models\User;
use Modules\Auth\App\Http\Requests\LoginRequest;
use Modules\Auth\App\Http\Requests\RegisterRequest;
use Modules\Auth\App\Http\Requests\ForgotPasswordRequest;
use Modules\Auth\App\Http\Requests\ResetPasswordRequest;
use Modules\Auth\App\Http\Requests\ChangePasswordRequest;

class AuthController extends Controller
{
    /**
     * Register
     */
    public function register(RegisterRequest $request)
    {
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'status'   => 'active'
        ]);
        $user->assignRole($request->role);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Conta criada com sucesso',
            'user'    => $user,
            'roles' => $user->getRoleNames(),
            'token'   => $token
        ], 201);
    }

    /**
     * Login
     */
    public function login(LoginRequest $request)
    {
        $credentials = $request->validated();

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Credenciais inválidas'
            ], 401);
        }

        $user = Auth::user();

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Conta inactiva'
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login efectuado com sucesso',
            'user'    => $user,
            'token'   => $token
        ]);
    }

    /**
     * Logout
     */
    public function logout()
    {
        auth()->user()->tokens()->delete();

        return response()->json([
            'message' => 'Logout efectuado com sucesso'
        ]);
    }

    /**
     * Current user
     */
    public function me()
    {
        return response()->json(auth()->user());
    }

    /**
     * Forgot password — envia email com link de reset
     */
    /**
 * Forgot password — envia email com link de reset
 */
public function forgotPassword(ForgotPasswordRequest $request)
{
    $user = User::where('email', $request->email)->first();

    $token = Password::createToken($user);

    $resetUrl = "http://localhost:3000/reset-password?token={$token}&email={$user->email}";

    \Log::info("Password reset link: {$resetUrl}");

    return response()->json([
        'message' => 'Email de recuperação enviado com sucesso.'
    ]);
}
    /**
     * Reset password — usa o token do email para redefinir
     */
    public function resetPassword(ResetPasswordRequest $request)
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password'       => Hash::make($password),
                    'remember_token' => Str::random(60)
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Token inválido ou expirado.'
            ], 400);
        }

        return response()->json([
            'message' => 'Senha redefinida com sucesso.'
        ]);
    }

    /**
     * Change password — utilizador autenticado muda a própria senha
     */
    public function changePassword(ChangePasswordRequest $request)
    {
        $user = auth()->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'A senha actual está incorrecta.'
            ], 400);
        }

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        // Invalida todos os tokens existentes e cria um novo
        $user->tokens()->delete();
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Senha alterada com sucesso.',
            'token'   => $token
        ]);
    }
}