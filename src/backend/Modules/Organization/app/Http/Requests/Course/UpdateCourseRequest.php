<?php

namespace Modules\Organization\app\Http\Requests\Course;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'scientific_area_id' => 'sometimes|exists:scientific_areas,id',
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|max:50|unique:courses,code,' . $this->route('id'),
        ];
    }

    public function messages(): array
    {
        return [
            'scientific_area_id.exists' => 'A área científica selecionada não existe',
            'name.max' => 'O nome não pode ter mais de 255 caracteres',
            'code.unique' => 'Já existe um curso com este código',
            'code.max' => 'O código não pode ter mais de 50 caracteres',
        ];
    }
}