<?php

namespace Modules\Auth\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_password' => 'required',
            'password'         => 'required|min:6|confirmed'
        ];
    }

    public function messages(): array
    {
        return [
            'current_password.required' => 'A senha actual é obrigatória.'
        ];
    }
}