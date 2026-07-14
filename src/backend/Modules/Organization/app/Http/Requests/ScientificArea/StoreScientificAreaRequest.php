<?php

namespace Modules\Organization\app\Http\Requests\ScientificArea;

use Illuminate\Foundation\Http\FormRequest;

class StoreScientificAreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'organ_id' => 'required|exists:organs,id',
            'name' => 'required|string|max:255|unique:scientific_areas,name',
        ];
    }

    public function messages(): array
    {
        return [
            'organ_id.required' => 'O órgão é obrigatório',
            'organ_id.exists' => 'O órgão selecionado não existe',
            'name.required' => 'O nome é obrigatório',
            'name.unique' => 'Já existe uma área científica com este nome',
            'name.max' => 'O nome não pode ter mais de 255 caracteres',
        ];
    }
}