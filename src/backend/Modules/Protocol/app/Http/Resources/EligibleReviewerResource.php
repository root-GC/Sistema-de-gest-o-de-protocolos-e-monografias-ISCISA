<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EligibleReviewerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $pendingTopicReviews = (int) ($this->pending_topic_reviews_count ?? 0);
        $pendingProtocolReviews = (int) ($this->pending_protocol_reviews_count ?? 0);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'scientific_area_name' => $this->scientific_area_name,
            'pending_topic_reviews_count' => $pendingTopicReviews,
            'pending_protocol_reviews_count' => $pendingProtocolReviews,
            'pending_reviews_count' => $pendingTopicReviews + $pendingProtocolReviews,
        ];
    }
}
