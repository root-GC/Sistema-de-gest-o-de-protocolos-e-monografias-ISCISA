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
        'type'     => ['required', 'in:student,teacher'],
        'name'     => ['required', 'string', 'max:255'],
        'email'    => ['required', 'email', 'unique:users,email'],
        'password' => ['required', 'string', 'min:8', 'confirmed'],

        // Estudante
        'course_id'      => ['required_if:type,student', 'integer', 'exists:courses,id'],
        'supervisor_id'  => ['required_if:type,student', 'integer', 'exists:teacher_profiles,id'],
        'student_number' => [
            'required_if:type,student',
            'string',
            'regex:/^\d{2}\.\d{4}\.\d{4}$/',
            'unique:student_profiles,student_number',
        ],

        // Docente
        'scientific_area_id' => ['required_if:type,teacher', 'integer', 'exists:scientific_areas,id'],
        'academic_degree'    => ['required_if:type,teacher', 'in:licenciatura,mestrado,doutoramento'],
        'department'         => ['sometimes', 'nullable', 'string', 'max:255'],
    ];
}

    public function messages(): array
    {
        return [
            'type.required'                  => 'Indique se é Estudante ou Docente.',
            'type.in'                        => 'Tipo de registo inválido.',
            'name.required'                  => 'O nome é obrigatório.',
            'email.required'                 => 'O email é obrigatório.',
            'email.email'                    => 'Formato de email inválido.',
            'email.unique'                   => 'Este email já está registado.',
            'password.required'              => 'A palavra-passe é obrigatória.',
            'password.min'                   => 'A palavra-passe deve ter pelo menos 8 caracteres.',
            'password.confirmed'             => 'As palavras-passe não coincidem.',
            'course_id.required_if'          => 'O curso é obrigatório para estudantes.',
            'course_id.exists'               => 'Curso inválido.',
            'student_number.required_if'     => 'O número de estudante é obrigatório.',
            'student_number.regex'           => 'Formato inválido. Use NN.NNNN.AAAA (ex: 01.4038.2023).',
            'student_number.unique'          => 'Este número de estudante já está registado.',
            'scientific_area_id.required_if' => 'A área científica é obrigatória para docentes.',
            'scientific_area_id.exists'      => 'Área científica inválida.',
            'academic_degree.required_if'    => 'O grau académico é obrigatório para docentes.',
            'academic_degree.in'             => 'Grau académico inválido.',
            'supervisor_id.required_if' => 'Seleccione o seu orientador/supervisor.',
            'supervisor_id.exists'      => 'Supervisor inválido.',
        ];
    }
}