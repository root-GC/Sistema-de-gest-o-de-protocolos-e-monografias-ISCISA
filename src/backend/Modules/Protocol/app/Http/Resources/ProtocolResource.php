<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ProtocolResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'supervisor_id' => $this->supervisor_id,
            'current_organ_id' => $this->current_organ_id,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'submitted_at' => $this->submitted_at,
            'approved_by_supervisor' => $this->approved_by_supervisor,
            'protocol_type' => $this->protocol_type,
            'submission_number' => $this->submission_number,
            'version' => $this->version,
            'supervisor_decision_at' => $this->supervisor_decision_at,
            'justification' => $this->justification,
            'nc_version' => $this->nc_version,
            'cc_version' => $this->cc_version,
            'cb_version' => $this->cb_version,
            // "student" é também a coluna que guarda o ID do estudante. Ao
            // aceder por propriedade, o Eloquent devolve esse inteiro antes da
            // relação; por isso a relação carregada precisa de ser obtida
            // explicitamente.
            'student' => $this->whenLoaded('student', function () {
                $student = $this->resource->getRelation('student');

                return $student ? [
                    'id' => $student->id,
                    'name' => $student->name,
                    'email' => $student->email,
                ] : null;
            }),
            'topic' => $this->whenLoaded('topic', fn() => [
                'id' => $this->topic->id,
                'title' => $this->topic->title,
                'justification' => $this->topic->justification,
                'status' => $this->topic->status,
            ]),
            'supervisor' => $this->whenLoaded('supervisor', fn() => [
                'id' => $this->supervisor?->id,
                'user' => $this->supervisor?->relationLoaded('user') && $this->supervisor->user ? [
                    'id' => $this->supervisor->user->id,
                    'name' => $this->supervisor->user->name,
                    'email' => $this->supervisor->user->email,
                ] : null,
            ]),
            'documents' => $this->whenLoaded('documents', fn() => $this->documents->map(fn($doc) => [
                'id' => $doc->id,
                'document_type' => $doc->document_type,
                'file_name' => $doc->file_name,
                'file_path' => $doc->file_path,
                'file_url' => Storage::disk('public')->url($doc->file_path),
                'download_url' => url("api/v1/protocols/{$this->id}/download"),
                'pages' => $doc->pages,
                'version' => $doc->version,
                'status' => $doc->status,
                'submitted_at' => $doc->created_at,
            ])),
        ];
    }
}
