<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TopicEvaluationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        if (! $this->resource) {
            return [];
        }

        return [
            'id' => $this->id,
            'decision' => $this->decision,
            'comment' => $this->whenLoaded('comment', fn() => $this->comment ? [
                'id' => $this->comment->id,
                'content' => $this->comment->content,
                'status' => $this->comment->status,
                'created_at' => $this->comment->created_at,
            ] : null),
            'comments' => $this->comments ?? null,
            'evaluated_at' => $this->evaluated_at,
        ];
    }
}
