<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TopicReviewCommentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'content' => $this->content,
            'status' => $this->status,
            'user' => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
            ],
            'evaluations' => $this->whenLoaded('evaluations', function () {
                return $this->evaluations->map(function ($evaluation) {
                    return [
                        'id' => $evaluation->id,
                        'decision' => $evaluation->decision,
                        'evaluated_at' => $evaluation->evaluated_at,
                        'reviewer' => [
                            'id' => $evaluation->reviewer?->id,
                            'name' => $evaluation->reviewer?->user?->name,
                            'email' => $evaluation->reviewer?->user?->email,
                        ],
                    ];
                });
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}