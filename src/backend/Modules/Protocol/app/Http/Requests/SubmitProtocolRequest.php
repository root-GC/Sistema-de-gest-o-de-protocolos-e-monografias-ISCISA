<?php

namespace Modules\Protocol\app\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubmitProtocolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'topic_id' => [
                'required',
                'integer',
                Rule::exists('topics', 'id'),
            ],
            'protocol_type' => [
                'required',
                'string',
                'max:100',
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
            'topic_id.required' => 'O tema e obrigatorio.',
            'topic_id.exists' => 'O tema informado nao existe.',
            'protocol_type.required' => 'O tipo de protocolo e obrigatorio.',
            'document.required' => 'O documento do protocolo e obrigatorio.',
            'document.mimes' => 'O protocolo deve ser enviado no formato .docx.',
            'document.mimetypes' => 'O protocolo deve ser um documento Word valido (.docx).',
            'document.max' => 'O documento do protocolo nao pode exceder 10MB.',
        ];
    }
}
