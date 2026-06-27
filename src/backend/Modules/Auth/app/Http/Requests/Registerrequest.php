<?php

namespace Modules\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // rota pública
    }

    public function rules(): array
    {
        return [
            'name'                  => ['required', 'string', 'max:255'],
            'email'                 => ['required', 'email', 'unique:users,email'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
            'student_number'        => ['required', 'string', 'unique:student_profiles,student_number'],
            'course_id'             => ['required', 'integer', 'exists:courses,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'                  => 'O nome é obrigatório.',
            'email.required'                 => 'O email é obrigatório.',
            'email.email'                    => 'Formato de email inválido.',
            'email.unique'                   => 'Este email já está registado.',
            'password.required'              => 'A palavra-passe é obrigatória.',
            'password.min'                   => 'A palavra-passe deve ter pelo menos 8 caracteres.',
            'password.confirmed'             => 'As palavras-passe não coincidem.',
            'student_number.required'        => 'O número de estudante é obrigatório.',
            'student_number.unique'          => 'Este número de estudante já existe.',
            'course_id.required'             => 'O curso é obrigatório.',
            'course_id.exists'               => 'Curso inválido.',
        ];
    }
}