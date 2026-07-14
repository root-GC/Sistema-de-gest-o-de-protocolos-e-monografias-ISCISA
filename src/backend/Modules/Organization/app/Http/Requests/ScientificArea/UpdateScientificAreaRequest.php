<?php

namespace Modules\Organization\app\Http\Requests\ScientificArea;

use Illuminate\Foundation\Http\FormRequest;

class UpdateScientificAreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'organ_id' => 'sometimes|exists:organs,id',
            'name' => 'sometimes|string|max:255|unique:scientific_areas,name,' . $this->route('id'),
        ];
    }

    public function messages(): array
    {
        return [
            'organ_id.exists' => 'O órgão selecionado não existe',
            'name.unique' => 'Já existe uma área científica com este nome',
            'name.max' => 'O nome não pode ter mais de 255 caracteres',
        ];
    }
}