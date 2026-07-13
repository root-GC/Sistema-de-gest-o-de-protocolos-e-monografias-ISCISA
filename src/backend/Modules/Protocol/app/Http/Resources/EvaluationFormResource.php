<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EvaluationFormResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'protocol_id' => $this->protocol_id,
            'version' => $this->version,
            'organ' => $this->organ,
            'status' => $this->status,
            'final_decision' => $this->final_decision,
            'decided_by' => $this->decided_by,
            'decided_at' => $this->decided_at,
            'conclusion_summary' => $this->conclusion_summary,
            'created_at' => $this->created_at,
            'protocol' => $this->whenLoaded('protocol', fn() => [
                'id' => $this->protocol->id,
                'code' => $this->protocol->code,
                'status' => $this->protocol->status,
                'status_label' => $this->protocol->status_label,
            ]),
            'form_criteria' => EvaluationFormCriterionResource::collection(
                $this->whenLoaded('formCriteria')
            ),
            'reviewer_evaluations' => ReviewerEvaluationResource::collection(
                $this->whenLoaded('reviewerEvaluations')
            ),
        ];
    }
}
