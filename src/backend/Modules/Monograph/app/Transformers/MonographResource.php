<?php

namespace Modules\Monograph\app\Transformers;

use Illuminate\Http\Resources\Json\JsonResource;

class MonographResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                     => $this->id,
            'title'                  => $this->title,
            'status'                 => $this->status->value,
            'status_label'           => $this->status->label(),
            'student'                => $this->whenLoaded('student', fn () => $this->student->name),
            'supervisor'             => $this->whenLoaded('supervisor', fn () => $this->supervisor->user->name),
            'supervisor_endorsed_at' => $this->supervisor_endorsed_at,
            'submitted_at'           => $this->submitted_at,
        ];
    }
}