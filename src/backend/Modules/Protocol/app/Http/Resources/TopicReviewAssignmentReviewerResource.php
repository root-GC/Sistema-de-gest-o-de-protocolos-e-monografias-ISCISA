<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TopicReviewAssignmentReviewerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        if (! $this->resource) {
            return [];
        }

        return [
            'id' => $this->id,
            'assigned_at' => $this->assigned_at,
            'evaluation' => $this->whenLoaded('evaluation', fn() => $this->evaluation ? [
                'decision' => $this->evaluation->decision,
                'comment' => $this->evaluation->comment ? [
                    'id' => $this->evaluation->comment->id,
                    'content' => $this->evaluation->comment->content,
                    'status' => $this->evaluation->comment->status,
                    'created_at' => $this->evaluation->comment->created_at,
                ] : null,
                'comments' => $this->evaluation->comments ?? null,
                'evaluated_at' => $this->evaluation->evaluated_at,
            ] : null),
        ];
    }
}
