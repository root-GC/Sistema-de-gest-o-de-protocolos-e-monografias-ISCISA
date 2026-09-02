<?php

namespace Modules\Auth\app\Http\Requests;

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
        'type'     => ['required', 'in:student'],
        'name'     => ['required', 'string', 'max:255'],
        'email'    => ['required', 'email', 'unique:users,email'],
        'password' => ['required', 'string', 'min:8', 'confirmed'],

        // Estudante
        'course_id'      => ['required', 'integer', 'exists:courses,id'],
        'supervisor_id'  => ['required', 'integer', 'exists:teacher_profiles,id'],
        'student_number' => [
            'required',
            'string',
            'max:255',
            'unique:student_profiles,student_number',
        ],
    ];
}

    public function messages(): array
    {
        return [
            'type.required'                  => 'Tipo de registo em falta.',
            'type.in'                        => 'Tipo de registo inválido.',
            'name.required'                  => 'O nome é obrigatório.',
            'email.required'                 => 'O email é obrigatório.',
            'email.email'                    => 'Formato de email inválido.',
            'email.unique'                   => 'Este email já está registado.',
            'password.required'              => 'A palavra-passe é obrigatória.',
            'password.min'                   => 'A palavra-passe deve ter pelo menos 8 caracteres.',
            'password.confirmed'             => 'As palavras-passe não coincidem.',
            'course_id.required'             => 'O curso é obrigatório.',
            'course_id.exists'               => 'Curso inválido.',
            'student_number.required'        => 'O número de estudante é obrigatório.',
            'student_number.unique'          => 'Este número de estudante já está registado.',
            'supervisor_id.required' => 'Seleccione o seu orientador/supervisor.',
            'supervisor_id.exists'      => 'Supervisor inválido.',
        ];
    }
}
