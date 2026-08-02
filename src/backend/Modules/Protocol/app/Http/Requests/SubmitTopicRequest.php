<?php

namespace Modules\Protocol\app\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubmitTopicRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:10', 'max:255'],
            'justification' => ['nullable', 'string', 'max:5000'],
            'scientific_area_id' => ['required', 'integer', Rule::exists('scientific_areas', 'id')],
            'course_id' => [
                'required',
                'integer',
                Rule::exists('courses', 'id')->where(
                    fn($query) => $query->where('scientific_area_id', $this->integer('scientific_area_id'))
                ),
            ],
            'document' => [
                'required',
                'file',
                'mimes:docx',
                'mimetypes:application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'max:10240',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'O titulo do tema e obrigatorio.',
            'title.min' => 'O titulo do tema deve ter pelo menos 10 caracteres.',
            'justification.max' => 'A justificacao nao pode exceder 5000 caracteres.',
            'scientific_area_id.required' => 'A area cientifica e obrigatoria.',
            'scientific_area_id.exists' => 'A area cientifica informada e invalida.',
            'course_id.required' => 'O curso e obrigatorio.',
            'course_id.exists' => 'O curso informado e invalido para a area cientifica selecionada.',
            'document.required' => 'O documento do tema e obrigatorio.',
            'document.mimes' => 'O documento deve ser um ficheiro .docx.',
            'document.mimetypes' => 'O documento deve ser um ficheiro .docx.',
            'document.max' => 'O documento nao pode exceder 10MB.',
        ];
    }
}
