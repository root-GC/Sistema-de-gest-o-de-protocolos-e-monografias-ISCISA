<?php

namespace Modules\Protocol\app\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\OrganDocumentRequirement;
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
            'required_documents' => ['sometimes', 'array'],
            'cibs_documents' => ['sometimes', 'array'],
            'other_documents' => [
                'sometimes',
                'array',
            ],
            'other_documents.*' => [
                'nullable',
                'file',
                'mimes:pdf',
                'mimetypes:application/pdf',
                'max:10240',
            ],
            'other_document_names' => [
                'sometimes',
                'array',
            ],
            'other_document_names.*' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];

        foreach (OrganDocumentRequirement::query()->activeForOrgan(Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE)->get() as $requirement) {
            $presenceRule = $allowsOptionalRequiredDocuments || $requirement->is_optional ? 'sometimes' : 'required';
            $rules["required_documents.{$requirement->document_key}"] = [
                $presenceRule,
                'nullable',
                'file',
                'mimes:pdf',
                'mimetypes:application/pdf',
                'max:10240',
            ];
        }

        foreach (OrganDocumentRequirement::query()->activeForOrgan(Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE)->get() as $requirement) {
            $presenceRule = $allowsOptionalRequiredDocuments || $requirement->is_optional ? 'sometimes' : 'required';
            $rules["cibs_documents.{$requirement->document_key}"] = [
                $presenceRule,
                'nullable',
                'file',
                'mimes:pdf',
                'mimetypes:application/pdf',
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
            'required_documents.required' => 'Os anexos obrigatórios do Comité Científico devem ser enviados.',
            'required_documents.array' => 'Os anexos obrigatorios devem ser enviados como lista de ficheiros.',
            'required_documents.*.required' => 'Todos os anexos obrigatorios do Comite Cientifico devem ser enviados.',
            'required_documents.*.mimes' => 'Os anexos devem estar em formato PDF.',
            'required_documents.*.mimetypes' => 'Os anexos devem ser ficheiros PDF validos.',
            'required_documents.*.max' => 'Cada anexo nao pode exceder 10MB.',
            'cibs_documents.required' => 'Os anexos do Comité de Bioética (CIBS) devem ser enviados.',
            'cibs_documents.array' => 'Os anexos do CIBS devem ser enviados como lista de ficheiros.',
            'cibs_documents.*.required' => 'Todos os anexos do Comite de Bioetica (CIBS) devem ser enviados.',
            'cibs_documents.*.mimes' => 'Os anexos do CIBS devem estar em formato PDF.',
            'cibs_documents.*.mimetypes' => 'Os anexos do CIBS devem ser ficheiros PDF validos.',
            'cibs_documents.*.max' => 'Cada anexo do CIBS nao pode exceder 10MB.',
            'other_documents.*.mimes' => 'Os anexos adicionais devem estar em formato PDF.',
            'other_documents.*.mimetypes' => 'Os anexos adicionais devem ser ficheiros PDF validos.',
            'other_documents.*.max' => 'Cada anexo adicional nao pode exceder 10MB.',
            'other_document_names.*.max' => 'O nome do anexo adicional nao pode exceder 255 caracteres.',
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
