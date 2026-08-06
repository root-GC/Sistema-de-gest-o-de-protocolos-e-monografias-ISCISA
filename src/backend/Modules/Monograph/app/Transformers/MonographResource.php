<?php

namespace Modules\Monograph\app\Transformers;

use Illuminate\Http\Resources\Json\JsonResource;

class MonographResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                     => $this->id,
            'code'                   => $this->code,
            'title'                  => $this->title,
            'status'                 => $this->status->value,
            'status_label'           => $this->status->label(),
            'student'                => $this->whenLoaded('student', fn () => $this->student->name),
            'supervisor'             => $this->whenLoaded('supervisor', fn () => $this->supervisor->user->name),
            'supervisor_endorsed_at' => $this->supervisor_endorsed_at,
            'submitted_at'           => $this->submitted_at,
            'defense'                => $this->whenLoaded('defense', fn () => $this->defense ? [
                'id'           => $this->defense->id,
                'status'       => $this->defense->status?->value,
                'status_label' => $this->defense->status?->label(),
                'scheduled_at' => $this->defense->scheduled_at?->toIso8601String(),
                'location'     => $this->defense->location,
            ] : null),
        ];
    }
}