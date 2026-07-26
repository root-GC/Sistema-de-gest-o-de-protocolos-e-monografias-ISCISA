<?php

namespace Modules\Auth\app\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginHttpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // rota pública
    }

    public function rules(): array
    {
        return [
            'email'    => ['required', 'email'],
            'password' => ['required', 'string', 'min:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required'    => 'O email é obrigatório.',
            'email.email'       => 'Formato de email inválido.',
            'password.required' => 'A palavra-passe é obrigatória.',
            'password.min'      => 'A palavra-passe deve ter pelo menos 6 caracteres.',
        ];
    }
}