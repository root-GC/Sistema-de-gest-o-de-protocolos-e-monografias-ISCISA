<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Protocol\app\Models\EvaluationForm;

class EvaluationFormResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $teacherProfile = $user?->teacherProfile;
        $isReviewer = $teacherProfile && $this->reviewerEvaluations
            ? $this->reviewerEvaluations->contains('reviewer_id', $teacherProfile->id)
            : false;

        $childForms = $this->relationLoaded('childForms') && $this->childForms
            ? $this->childForms
            : collect();

        $deliberationForm = $childForms->where('form_type', 'deliberation')->first();

        return [
            'id' => $this->id,
            'protocol_id' => $this->protocol_id,
            'version' => $this->version,
            'form_type' => $this->form_type,
            'parent_form_id' => $this->parent_form_id,
            'organ' => $this->organ,
            'status' => $this->status,
            'final_decision' => $this->final_decision,
            'decided_by' => $this->decided_by,
            'decided_at' => $this->decided_at,
            'conclusion_summary' => $this->conclusion_summary,
            'created_at' => $this->created_at,
            'auto_approved' => $this->final_decision && $this->decided_by === null,
            'deliberation_pending' => $this->status === EvaluationForm::STATUS_DELIBERATION_PENDING,
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
            'parent_form' => $this->whenLoaded('parentForm', fn() => $this->parentForm ? [
                'id' => $this->parentForm->id,
                'form_type' => $this->parentForm->form_type,
                'status' => $this->parentForm->status,
                'final_decision' => $this->parentForm->final_decision,
            ] : null),
            'deliberation_form' => $deliberationForm ? [
                'id' => $deliberationForm->id,
                'form_type' => $deliberationForm->form_type,
                'status' => $deliberationForm->status,
            ] : null,
        ];
    }
}
