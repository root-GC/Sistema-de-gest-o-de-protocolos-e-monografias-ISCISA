<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TopicReviewAssignmentSecretaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        if (! $this->resource) {
            return [];
        }

        return [
            'id' => $this->id,
            'assigned_at' => $this->assigned_at,
            'reviewer' => $this->whenLoaded('reviewer', fn() => [
                'id' => $this->reviewer->id,
                'name' => $this->reviewer->user?->name,
                'email' => $this->reviewer->user?->email,
            ]),
            'evaluation' => $this->whenLoaded('evaluation', fn() => $this->evaluation ? [
                'decision' => $this->evaluation->decision,
                'comment' => $this->evaluation->comment ? [
                    'id' => $this->evaluation->comment->id,
                    'content' => $this->evaluation->comment->content,
                    'status' => $this->evaluation->comment->status,
                ] : null,
                'evaluated_at' => $this->evaluation->evaluated_at,
            ] : null),
        ];
    }
}
