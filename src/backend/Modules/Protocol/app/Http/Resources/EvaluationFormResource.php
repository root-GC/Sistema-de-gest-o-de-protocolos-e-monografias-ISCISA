<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Protocol\app\Models\EvaluationForm;
use Modules\Protocol\app\Models\Protocol;

class EvaluationFormResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $teacherProfile = $user?->teacherProfile;
        $isReviewer = $teacherProfile && $this->reviewerEvaluations
            ? $this->reviewerEvaluations->contains('reviewer_id', $teacherProfile->id)
            : false;
        $myReviewerEvaluation = $teacherProfile && $this->reviewerEvaluations
            ? $this->reviewerEvaluations->firstWhere('reviewer_id', $teacherProfile->id)
            : null;
        $isPrimaryReviewer = (bool) $myReviewerEvaluation?->protocolReviewAssignment?->is_primary;
        $canAccessForm = $this->organ !== Protocol::ORGAN_COMITE_BIOETICA
            || $isReviewer
            || ($user?->hasPermission('protocol.assign') ?? false);
        $isSharedCommittee = in_array($this->organ, [
            Protocol::ORGAN_COMITE_CIENTIFICO,
            Protocol::ORGAN_COMITE_BIOETICA,
        ], true);
        $canShowFormFields = $canAccessForm && (
            ! $isSharedCommittee
            || in_array($this->status, [
                EvaluationForm::STATUS_IN_DELIBERATION,
                EvaluationForm::STATUS_DELIBERATED,
                EvaluationForm::STATUS_CONCLUDED,
            ], true)
        );

        return [
            'id' => $this->id,
            'protocol_id' => $this->protocol_id,
            'version' => $this->version,
            'form_type' => $this->form_type,
            'parent_form_id' => $this->parent_form_id,
            'organ' => $this->organ,
            'is_shared_form' => $isSharedCommittee,
            'is_primary_reviewer' => $isPrimaryReviewer,
            'can_access_form' => $canAccessForm,
            'status' => $this->status,
            'final_decision' => $this->final_decision,
            'harmonized_decision' => $this->harmonized_decision,
            'harmonized_at' => $this->harmonized_at,
            'decided_by' => $this->decided_by,
            'decided_at' => $this->decided_at,
            'conclusion_summary' => $this->conclusion_summary,
            'created_at' => $this->created_at,
            'deliberation_date' => $this->deliberation_date,
            'deliberation_location' => $this->deliberation_location,
            'deliberation_scheduled_by' => $this->deliberation_scheduled_by,
            'auto_approved' => $this->final_decision && $this->decided_by === null,
            'deliberation_pending' => $this->status === EvaluationForm::STATUS_DELIBERATION_PENDING,
            'deliberation_scheduled' => $this->deliberation_date !== null
                && ! in_array($this->status, [EvaluationForm::STATUS_IN_DELIBERATION, EvaluationForm::STATUS_DELIBERATED, EvaluationForm::STATUS_CONCLUDED], true),
            'in_deliberation' => $this->status === EvaluationForm::STATUS_IN_DELIBERATION,
            'protocol' => $this->whenLoaded('protocol', fn() => [
                'id' => $this->protocol->id,
                'code' => $this->protocol->code,
                'status' => $this->protocol->status,
                'status_label' => $this->protocol->status_label,
            ]),
            'form_criteria' => $this->when(
                $canShowFormFields && $this->relationLoaded('formCriteria'),
                fn() => EvaluationFormCriterionResource::collection($this->formCriteria)
            ),
            'reviewer_evaluations' => $canAccessForm
                ? ReviewerEvaluationResource::collection($this->whenLoaded('reviewerEvaluations'))
                : $this->whenLoaded('reviewerEvaluations', fn() => $this->reviewerEvaluations
                    ->map(fn($reviewerEvaluation) => [
                        'id' => $reviewerEvaluation->id,
                        'evaluation_form_id' => $reviewerEvaluation->evaluation_form_id,
                        'reviewer_id' => $reviewerEvaluation->reviewer_id,
                        'status' => $reviewerEvaluation->status,
                        'is_evaluated' => $reviewerEvaluation->status === \Modules\Protocol\app\Models\ReviewerEvaluation::STATUS_SUBMITTED,
                        'is_primary' => (bool) $reviewerEvaluation->protocolReviewAssignment?->is_primary,
                        'role' => $reviewerEvaluation->protocolReviewAssignment?->is_primary ? 'primary' : 'reviewer',
                        'submitted_at' => $reviewerEvaluation->submitted_at,
                        'evaluated_at' => $reviewerEvaluation->submitted_at,
                        'reviewer' => $reviewerEvaluation->reviewer ? [
                            'id' => $reviewerEvaluation->reviewer->id,
                            'user' => $reviewerEvaluation->reviewer->relationLoaded('user') && $reviewerEvaluation->reviewer->user ? [
                                'id' => $reviewerEvaluation->reviewer->user->id,
                                'name' => $reviewerEvaluation->reviewer->user->name,
                            ] : null,
                        ] : null,
                    ])
                    ->values()),
            'criteria_comments' => $this->when(
                $canShowFormFields && $this->relationLoaded('formCriteria') && $this->relationLoaded('reviewerEvaluations'),
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

            if (in_array($this->organ, [Protocol::ORGAN_COMITE_CIENTIFICO, Protocol::ORGAN_COMITE_BIOETICA], true) && $existing) {
                $reviews = collect([[
                    'reviewer_id' => null,
                    'reviewer_name' => '',
                    'comment' => $existing['comment'],
                    'is_shared' => true,
                ]]);
            }

            return [
                'form_criterion_id' => $fc->id,
                'criterion_id' => $fc->criterion_id,
                'criterion_name' => $fc->criterion_name,
                'group_name' => $fc->group_name,
                'order_column' => $fc->order_column,
                'reviews' => $reviews->toArray(),
            ];
        })->toArray();
    }
}
