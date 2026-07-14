<?php

namespace Modules\Organization\app\Http\Requests\Course;

use Illuminate\Foundation\Http\FormRequest;

class StoreCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'scientific_area_id' => 'required|exists:scientific_areas,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:courses,code',
        ];
    }

    public function messages(): array
    {
        return [
            'scientific_area_id.required' => 'A área científica é obrigatória',
            'scientific_area_id.exists' => 'A área científica selecionada não existe',
            'name.required' => 'O nome é obrigatório',
            'name.max' => 'O nome não pode ter mais de 255 caracteres',
            'code.required' => 'O código é obrigatório',
            'code.unique' => 'Já existe um curso com este código',
            'code.max' => 'O código não pode ter mais de 50 caracteres',
        ];
    }
}