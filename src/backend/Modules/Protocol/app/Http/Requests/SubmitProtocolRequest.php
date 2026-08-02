<?php

namespace Modules\Protocol\app\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\ProtocolDocumentRequirement;
use Modules\Protocol\app\Models\Topic;

class SubmitProtocolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $allowsOptionalRequiredDocuments = $this->allowsOptionalRequiredDocuments();

        $rules = [
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
            'required_documents' => [
                $allowsOptionalRequiredDocuments ? 'sometimes' : 'required',
                'array',
            ],
        ];

        foreach (ProtocolDocumentRequirement::CC_REQUIRED_DOCUMENTS as $key => $name) {
            $rules["required_documents.{$key}"] = [
                $allowsOptionalRequiredDocuments ? 'sometimes' : 'required',
                'file',
                'mimes:pdf,doc,docx',
                'max:10240',
            ];
        }

        return $rules;
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
            'required_documents.required' => 'Os anexos obrigatorios do Comite Cientifico devem ser enviados.',
            'required_documents.array' => 'Os anexos obrigatorios devem ser enviados como lista de ficheiros.',
            'required_documents.*.required' => 'Todos os anexos obrigatorios do Comite Cientifico devem ser enviados.',
            'required_documents.*.mimes' => 'Os anexos devem estar em PDF, DOC ou DOCX.',
            'required_documents.*.max' => 'Cada anexo nao pode exceder 10MB.',
        ];
    }

    private function allowsOptionalRequiredDocuments(): bool
    {
        $topicId = $this->input('topic_id');

        if (! is_numeric($topicId)) {
            return false;
        }

        $topic = Topic::query()->find((int) $topicId);

        if (! $topic) {
            return false;
        }

        $latestProtocol = Protocol::query()
            ->where('topic_id', $topic->id)
            ->latest('submitted_at')
            ->first();

        return $latestProtocol
            && in_array($latestProtocol->status, Protocol::resubmittableStatuses(), true);
    }
}
