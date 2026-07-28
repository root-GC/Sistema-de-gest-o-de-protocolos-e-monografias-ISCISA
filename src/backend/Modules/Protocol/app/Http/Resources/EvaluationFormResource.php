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
            'deliberation_date' => $this->deliberation_date,
            'deliberation_location' => $this->deliberation_location,
            'deliberation_scheduled_by' => $this->deliberation_scheduled_by,
            'auto_approved' => $this->final_decision && $this->decided_by === null,
            'deliberation_pending' => $this->status === EvaluationForm::STATUS_DELIBERATION_PENDING,
            'deliberation_scheduled' => $this->status === EvaluationForm::STATUS_DELIBERATION_SCHEDULED,
            'in_deliberation' => $this->status === EvaluationForm::STATUS_IN_DELIBERATION,
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
            'criteria_comments' => $this->when(
                $this->relationLoaded('formCriteria') && $this->relationLoaded('reviewerEvaluations'),
                fn() => $this->buildCriteriaComments()
            ),
            'parent_form' => $this->whenLoaded('parentForm', fn() => $this->parentForm ? [
                'id' => $this->parentForm->id,
                'form_type' => $this->parentForm->form_type,
                'status' => $this->parentForm->status,
                'final_decision' => $this->parentForm->final_decision,
            ] : null),
        ];
    }

    private function buildCriteriaComments(): array
    {
        $reviewerMap = collect();

        foreach ($this->reviewerEvaluations as $revEval) {
            $reviewerName = $revEval->reviewer?->user?->name ?? 'Desconhecido';
            foreach ($revEval->criterionReviews as $cr) {
                $reviewerMap->push([
                    'form_criterion_id' => $cr->evaluation_form_criterion_id,
                    'criterion_id' => $cr->formCriterion?->criterion_id,
                    'criterion_name' => $cr->formCriterion?->criterion_name,
                    'group_name' => $cr->formCriterion?->group_name,
                    'order_column' => $cr->formCriterion?->order_column,
                    'reviewer_id' => $revEval->reviewer_id,
                    'reviewer_name' => $reviewerName,
                    'comment' => $cr->comment,
                ]);
            }
        }

        return $this->formCriteria->map(function ($fc) use ($reviewerMap) {
            $reviews = $reviewerMap
                ->where('form_criterion_id', $fc->id)
                ->values()
                ->map(fn($r) => [
                    'reviewer_id' => $r['reviewer_id'],
                    'reviewer_name' => $r['reviewer_name'],
                    'comment' => $r['comment'],
                ]);

            $existing = $reviews->first();

            return [
                'criterion_id' => $fc->criterion_id,
                'criterion_name' => $fc->criterion_name,
                'group_name' => $fc->group_name,
                'order_column' => $fc->order_column,
                'reviews' => $reviews->toArray(),
            ];
        })->toArray();
    }
}
