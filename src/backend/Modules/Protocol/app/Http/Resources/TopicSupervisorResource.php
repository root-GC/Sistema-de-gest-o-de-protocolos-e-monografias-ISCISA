<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TopicSupervisorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'justification' => $this->justification,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'supervisor_status' => $this->supervisor_status,
            'supervisor_comment' => $this->supervisor_comment,
            'supervisor_decision_at' => $this->supervisor_decision_at,
            'submitted_at' => $this->submitted_at,
            'student' => $this->whenLoaded('student', fn() => $this->student ? [
                'id' => $this->student->id,
                'name' => $this->student->name,
                'email' => $this->student->email,
            ] : null),
            'scientific_area' => $this->whenLoaded('scientificArea', fn() => [
                'id' => $this->scientificArea->id,
                'name' => $this->scientificArea->name,
            ]),
            'course' => $this->whenLoaded('course', fn() => [
                'id' => $this->course->id,
                'name' => $this->course->name,
                'code' => $this->course->code,
            ]),
        ];
    }
}
