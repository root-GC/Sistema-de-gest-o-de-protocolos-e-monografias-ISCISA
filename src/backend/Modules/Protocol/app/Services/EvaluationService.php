<?php

namespace Modules\Protocol\app\Services;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Protocol\app\Models\EvaluationCriterion;
use Modules\Protocol\app\Models\EvaluationCriterionReview;
use Modules\Protocol\app\Models\EvaluationForm;
use Modules\Protocol\app\Models\EvaluationFormCriterion;
use Modules\Protocol\app\Models\Opinion;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\ProtocolReviewAssignment;
use Modules\Protocol\app\Models\ReviewerEvaluation;
use Modules\User\app\Models\Organ;
use Modules\User\app\Models\User;

class EvaluationService
{
    public function createForProtocol(Protocol $protocol, array $reviewerIds, User $secretary, string $organ = 'nucleo'): EvaluationForm
    {
        return DB::transaction(function () use ($protocol, $reviewerIds, $secretary, $organ) {
            $protocol = Protocol::lockForUpdate()->findOrFail($protocol->id);
            $version = $protocol->version ?: '1';

            $form = EvaluationForm::query()->firstOrCreate(
                [
                    'protocol_id' => $protocol->id,
                    'version' => $version,
                    'organ' => $organ,
                ],
                ['status' => EvaluationForm::STATUS_PENDING_REVIEW]
            );

            if (! $form->formCriteria()->exists()) {
                $criteria = EvaluationCriterion::query()
                    ->where('is_active', true)
                    ->orderBy('order_column')
                    ->get();

                if ($criteria->isEmpty()) {
                    throw new HttpResponseException(
                        response()->json([
                            'message' => 'Nenhum critério de avaliação activo encontrado. Execute o seeder: php artisan module:seed Protocol',
                        ], 500)
                    );
                }

                foreach ($criteria as $criterion) {
                    EvaluationFormCriterion::create([
                        'evaluation_form_id' => $form->id,
                        'criterion_id' => $criterion->id,
                        'group_name' => $criterion->group_name,
                        'criterion_name' => $criterion->name,
                        'order_column' => $criterion->order_column,
                    ]);
                }
            }

            $assignment = null;

            if ($reviewerIds !== []) {
                $assignment = ProtocolReviewAssignment::query()
                    ->where('protocol_id', $protocol->id)
                    ->where('organ_id', $protocol->current_organ_id)
                    ->latest('assigned_at')
                    ->first();

                if (! $assignment) {
                    throw new HttpResponseException(
                        response()->json(['message' => 'Nenhuma atribuição de revisores encontrada para este protocolo neste orgao.'], 422)
                    );
                }
            }

            foreach ($reviewerIds as $reviewerId) {
                if (! $reviewerId) {
                    continue;
                }

                ReviewerEvaluation::query()->firstOrCreate(
                    [
                        'evaluation_form_id' => $form->id,
                        'reviewer_id' => $reviewerId,
                    ],
                    [
                        'protocol_review_assignment_id' => $assignment?->id,
                        'status' => ReviewerEvaluation::STATUS_PENDING,
                    ]
                );
            }

            return $form->load(['formCriteria', 'reviewerEvaluations']);
        });
    }

    public function getFormWithReviews(EvaluationForm $form, User $user): EvaluationForm
    {
        $teacherProfile = $user->teacherProfile;

        $form->load([
            'protocol.topic:id,title,status',
            'protocol.topic.scientificArea:id,name',
            'protocol.topic.course:id,name,code',
            'formCriteria' => fn($q) => $q->orderBy('order_column'),
            'reviewerEvaluations' => fn($q) => $q->with([
                'criterionReviews',
                'reviewer.user:id,name',
            ]),
        ]);

        return $form;
    }

    public function saveCriterionReview(EvaluationForm $form, EvaluationFormCriterion $formCriterion, User $user, ?string $comment): EvaluationCriterionReview
    {
        return DB::transaction(function () use ($form, $formCriterion, $user, $comment) {
            $teacherProfile = $user->teacherProfile;

            $reviewerEvaluation = $form->reviewerEvaluations()
                ->where('reviewer_id', $teacherProfile->id)
                ->first();

            if (! $reviewerEvaluation) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Não está atribuído como revisor desta ficha.'], 403)
                );
            }

            if ($reviewerEvaluation->status === ReviewerEvaluation::STATUS_SUBMITTED) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Avaliação já foi submetida. Não é possível alterar.'], 422)
                );
            }

            $criterionReview = EvaluationCriterionReview::query()->updateOrCreate(
                [
                    'reviewer_evaluation_id' => $reviewerEvaluation->id,
                    'evaluation_form_criterion_id' => $formCriterion->id,
                ],
                ['comment' => $comment]
            );

            if ($reviewerEvaluation->status === ReviewerEvaluation::STATUS_PENDING) {
                $reviewerEvaluation->update(['status' => ReviewerEvaluation::STATUS_IN_PROGRESS]);
            }

            return $criterionReview->load('formCriterion');
        });
    }

    public function submitEvaluation(EvaluationForm $form, User $reviewer, string $recommendation, ?string $overallComment): ReviewerEvaluation
    {
        return DB::transaction(function () use ($form, $reviewer, $recommendation, $overallComment) {
            $teacherProfile = $reviewer->teacherProfile;

            $reviewerEvaluation = $form->reviewerEvaluations()
                ->where('reviewer_id', $teacherProfile->id)
                ->first();

            if (! $reviewerEvaluation) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Não está atribuído como revisor desta ficha.'], 403)
                );
            }

            if ($reviewerEvaluation->status === ReviewerEvaluation::STATUS_SUBMITTED) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Avaliação já foi submetida anteriormente.'], 422)
                );
            }

            $totalCriteria = $form->formCriteria()->count();
            $reviewedCount = $reviewerEvaluation->criterionReviews()->count();

            if ($totalCriteria > 0 && $reviewedCount === 0) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Deve preencher pelo menos um comentário antes de submeter.'], 422)
                );
            }

            $reviewerEvaluation->update([
                'recommendation' => $recommendation,
                'overall_comment' => $overallComment,
                'status' => ReviewerEvaluation::STATUS_SUBMITTED,
                'submitted_at' => now(),
            ]);

            $form->update(['status' => EvaluationForm::STATUS_IN_REVIEW]);

            return $reviewerEvaluation->load(['criterionReviews.formCriterion']);
        });
    }

    public function decide(EvaluationForm $form, User $decider, string $decision, ?string $conclusionSummary): array
    {
        return DB::transaction(function () use ($form, $decider, $decision, $conclusionSummary) {
            $form = EvaluationForm::lockForUpdate()->findOrFail($form->id);
            $teacherProfile = $decider->teacherProfile;
            $protocol = $form->protocol()->first();

            if (! $teacherProfile) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Apenas docentes podem decidir.'], 403)
                );
            }

            $isReviewer = $form->reviewerEvaluations()
                ->where('reviewer_id', $teacherProfile->id)
                ->exists();

            if (! $isReviewer) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Apenas um revisor atribuído pode decidir.'], 403)
                );
            }

            $allSubmitted = ! $form->reviewerEvaluations()
                ->whereNotIn('status', [ReviewerEvaluation::STATUS_SUBMITTED])
                ->exists();

            if (! $allSubmitted) {
                throw new HttpResponseException(
                    response()->json(['message' => 'A decisão final só pode ser tomada após todos os revisores submeterem as suas avaliações.'], 422)
                );
            }

            if ($form->status === EvaluationForm::STATUS_CONCLUDED) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Esta ficha já foi concluída.'], 422)
                );
            }

            $form->update([
                'final_decision' => $decision,
                'decided_by' => $decider->id,
                'decided_at' => now(),
                'status' => EvaluationForm::STATUS_CONCLUDED,
                'conclusion_summary' => $conclusionSummary,
            ]);

            $protocolUpdates = [];
            $flow = null;

            if ($decision === 'rejected') {
                $rejectedStatus = match ($form->organ) {
                    Protocol::ORGAN_NUCLEO => Protocol::STATUS_REJECTED_NUCLEO,
                    Protocol::ORGAN_COMITE_CIENTIFICO => Protocol::STATUS_REJECTED_CC,
                    Protocol::ORGAN_COMITE_BIOETICA => Protocol::STATUS_REJECTED_BIOETICA,
                    default => Protocol::STATUS_REJECTED_FINAL,
                };
                $protocolUpdates['status'] = $rejectedStatus;
            } else {
                $organType = Protocol::organTypeFromFormOrgan($form->organ);
                $flow = $organType ? Protocol::ORGAN_FLOW[$organType] ?? null : null;

                if (! $flow) {
                    throw new HttpResponseException(
                        response()->json(['message' => "Orgao desconhecido: {$form->organ}"], 500)
                    );
                }

                $protocolUpdates['status'] = $flow['next_status'];

                if ($flow['next_organ_type']) {
                    $nextOrgan = Organ::query()
                        ->where('type', $flow['next_organ_type'])
                        ->first();

                    if (! $nextOrgan) {
                        throw new HttpResponseException(
                            response()->json(['message' => "Proximo orgao nao encontrado: {$flow['next_organ_type']}"], 500)
                        );
                    }

                    $protocolUpdates['current_organ_id'] = $nextOrgan->id;
                }

                if ($flow['version_field'] && $flow['version_prefix']) {
                    $field = $flow['version_field'];
                    $versionNumber = max(1, ((int) $protocol->{$field}) + 1);

                    $protocolUpdates[$field] = $versionNumber;
                    $protocolUpdates['version'] = $flow['version_prefix'] . sprintf('%02d', $versionNumber);
                } else {
                    $protocolUpdates['version'] = 'APROVADO';
                }
            }

            $protocol->update($protocolUpdates);

            if ($decision === 'approved' && $flow && $flow['next_organ_type']) {
                $this->createForProtocol(
                    $protocol->fresh(),
                    [],
                    $decider,
                    $flow['next_form_organ']
                );
            }

            $opinionVersion = $protocolUpdates['version'] ?? $form->version;

            $opinion = Opinion::create([
                'protocol_id' => $protocol->id,
                'evaluation_form_id' => $form->id,
                'version' => $opinionVersion,
                'organ' => $form->organ,
                'decision' => $decision,
                'observations' => $conclusionSummary,
                'issued_by' => $decider->id,
                'issued_at' => now(),
            ]);

            $opinion->fresh();

            $form->load([
                'protocol',
                'reviewerEvaluations.criterionReviews.formCriterion',
                'formCriteria',
            ]);

            return [
                'evaluation_form' => $form,
                'opinion' => $opinion,
            ];
        });
    }

    public function listForReviewer(User $reviewer): Collection
    {
        $teacherProfile = $reviewer->teacherProfile;

        if (! $teacherProfile) {
            return collect();
        }

        return EvaluationForm::query()
            ->whereHas('reviewerEvaluations', fn($q) => $q->where('reviewer_id', $teacherProfile->id))
            ->with([
                'protocol.topic:id,title,status',
                'protocol.topic.scientificArea:id,name',
                'protocol.topic.course:id,name,code',
                'reviewerEvaluations' => fn($q) => $q
                    ->where('reviewer_id', $teacherProfile->id)
                    ->with('criterionReviews.formCriterion'),
            ])
            ->latest('created_at')
            ->get();
    }

    public function listForSecretary(User $secretary): Collection
    {
        $secretaryProfile = $secretary->secretaryProfile;

        if (! $secretaryProfile) {
            return collect();
        }

        $organ = $secretaryProfile->organ;

        if (! $organ) {
            return collect();
        }

        $statusMap = [
            Protocol::ORGAN_TYPE_NUCLEUS => [
                Protocol::STATUS_PENDING_NUCLEO,
                Protocol::STATUS_IN_REVIEW_NUCLEO,
            ],
            Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE => [
                Protocol::STATUS_PENDING_COMITE_CIENTIFICO,
                Protocol::STATUS_IN_REVIEW_COMITE_CIENTIFICO,
            ],
            Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE => [
                Protocol::STATUS_PENDING_COMITE_BIOETICA,
                Protocol::STATUS_IN_REVIEW_COMITE_BIOETICA,
            ],
        ];

        $statuses = $statusMap[$organ->type] ?? [];
        $formOrgan = Protocol::formOrganFromOrganType($organ->type);

        if ($statuses === [] || ! $formOrgan) {
            return collect();
        }

        return EvaluationForm::query()
            ->whereHas(
                'protocol',
                fn($q) => $q
                    ->whereIn('status', $statuses)
                    ->where('current_organ_id', $organ->id)
            )
            ->where('organ', $formOrgan)
            ->with([
                'protocol.topic:id,title,status,scientific_area_id,supervisor_id',
                'protocol.topic.scientificArea:id,name,organ_id',
                'protocol.student:id,name,email',
                'protocol.supervisor.user:id,name,email',
                'reviewerEvaluations.reviewer.user:id,name,email',
                'formCriteria',
            ])
            ->latest('created_at')
            ->get();
    }
}
