<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'document_type' => $this->document_type,
            'file_name' => $this->file_name,
            'download_url' => url("api/v1/protocols/{$this->protocol_id}/documents/{$this->id}/download"),
            'pages' => $this->pages,
            'version' => $this->version,
            'version_label' => $this->version_label,
            'rejected_by' => $this->whenLoaded('rejectedBy', fn() => $this->rejectedBy ? [
                'id' => $this->rejectedBy->id,
                'name' => $this->rejectedBy->name,
                'email' => $this->rejectedBy->email,
            ] : null),
            'rejected_at' => $this->rejected_at,
            'status' => $this->status,
            'submitted_by' => $this->whenLoaded('submitter', fn() => [
                'id' => $this->submitter->id,
                'name' => $this->submitter->name,
                'email' => $this->submitter->email,
            ]),
            'submitted_at' => $this->created_at,
        ];
    }
}
