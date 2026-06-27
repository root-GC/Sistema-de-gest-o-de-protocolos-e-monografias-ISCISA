<?php

namespace Modules\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'token'                 => ['required', 'string'],
            'email'                 => ['required', 'email'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'token.required'        => 'Token inválido.',
            'email.required'        => 'O email é obrigatório.',
            'password.required'     => 'A palavra-passe é obrigatória.',
            'password.min'          => 'Mínimo 8 caracteres.',
            'password.confirmed'    => 'As palavras-passe não coincidem.',
        ];
    }
}