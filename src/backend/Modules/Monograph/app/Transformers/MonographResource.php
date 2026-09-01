<?php

namespace Modules\Monograph\app\Transformers;

use Illuminate\Http\Resources\Json\JsonResource;

class MonographResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                     => $this->id,
            'code'                   => 'MON-' . $this->id,
            'title'                  => $this->title,
            'status'                 => $this->status->value,
            'status_label'           => $this->status->label(),
            'submission_number'      => $this->submissions->max('version') ?? 0,
            'version'                => $this->submissions->max('version') ?? 0,
            'student'                => $this->whenLoaded('student', fn () => [
                'id' => $this->student->id,
                'name' => $this->student->name,
                'email' => $this->student->email,
            ]),
            'supervisor'             => $this->whenLoaded('supervisor', fn () => [
                'id' => $this->supervisor->id,
                'name' => $this->supervisor->user?->name,
                'email' => $this->supervisor->user?->email,
            ]),
            'documents'              => $this->whenLoaded('documents', fn () => $this->documents->map(fn ($document) => [
                'id' => $document->id,
                'file_name' => $document->file_name,
                'version' => $document->version,
                'status' => $document->status,
                'download_url' => url("api/monographs/{$this->id}/documents/{$document->id}/download"),
                'created_at' => $document->created_at,
            ])->values()),
            'supervisor_endorsed_at' => $this->supervisor_endorsed_at,
            'submitted_at'           => $this->submitted_at,
            'created_at'             => $this->created_at,
            'updated_at'             => $this->updated_at,
        ];
    }
}
