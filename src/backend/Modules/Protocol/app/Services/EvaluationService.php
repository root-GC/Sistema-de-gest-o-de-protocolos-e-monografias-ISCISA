<?php

namespace Modules\Protocol\app\Services;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Protocol\app\Events\ProtocolStatusChanged;
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
    public function createForProtocol(Protocol $protocol, array $reviewerIds, User $secretary, string $organ = 'nucleo', string $formType = EvaluationForm::FORM_TYPE_EVALUATION): EvaluationForm
    {
        return DB::transaction(function () use ($protocol, $reviewerIds, $secretary, $organ, $formType) {
            $protocol = Protocol::lockForUpdate()->findOrFail($protocol->id);
            $version = $protocol->version ?: '1';

            $form = EvaluationForm::query()->firstOrCreate(
                [
                    'protocol_id' => $protocol->id,
                    'version' => $version,
                    'organ' => $organ,
                    'form_type' => $formType,
                ],
                [
                    'status' => EvaluationForm::STATUS_PENDING_REVIEW,
                    'form_type' => $formType,
                ]
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
            //Não tinha
            return $form;

        });
    }

    public function getFormWithReviews(EvaluationForm $form, User $user): EvaluationForm
    {
        $teacherProfile = $user->teacherProfile;
        $isReviewer = $teacherProfile && $form->reviewerEvaluations()
            ->where('reviewer_id', $teacherProfile->id)
            ->exists();

        $form->load([
            'protocol.topic:id,title,status',
            'protocol.topic.scientificArea:id,name',
            'protocol.topic.course:id,name,code',
            'protocol.student:id,name,email',
            'formCriteria' => fn($q) => $q->orderBy('order_column'),
            'reviewerEvaluations' => fn($q) => $q->with([
                'criterionReviews',
                'reviewer.user:id,name',
            ]),
            'parentForm.reviewerEvaluations.reviewer.user:id,name',
            'childForms.reviewerEvaluations.reviewer.user:id,name',
        ]);

        $form->load(['reviewerEvaluations.criterionReviews.formCriterion']);

        return $form;
    }

    public function saveCriterionReview(EvaluationForm $form, EvaluationFormCriterion $formCriterion, User $user, ?string $comment): EvaluationCriterionReview
    {
        return DB::transaction(function () use ($form, $formCriterion, $user, $comment) {
            $teacherProfile = $user->teacherProfile;

            if ($form->status === EvaluationForm::STATUS_IN_DELIBERATION) {
                $reviewerEvaluations = $form->reviewerEvaluations()->get();

                if ($reviewerEvaluations->isEmpty()) {
                    throw new HttpResponseException(
                        response()->json(['message' => 'Nenhum revisor encontrado nesta ficha.'], 403)
                    );
                }

                $isReviewer = $reviewerEvaluations->contains('reviewer_id', $teacherProfile->id);
                if (! $isReviewer) {
                    throw new HttpResponseException(
                        response()->json(['message' => 'Não está atribuído como revisor desta ficha.'], 403)
                    );
                }

                $primary = $reviewerEvaluations->first();

                $criterionReview = EvaluationCriterionReview::query()->updateOrCreate(
                    [
                        'reviewer_evaluation_id' => $primary->id,
                        'evaluation_form_criterion_id' => $formCriterion->id,
                    ],
                    ['comment' => $comment]
                );

                return $criterionReview->load('formCriterion');
            }

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

    public function submitEvaluation(EvaluationForm $form, User $reviewer, string $decision, ?string $overallComment = null): array
    {
        return DB::transaction(function () use ($form, $reviewer, $decision, $overallComment) {
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
                'decision' => $decision,
                'overall_comment' => $overallComment,
                'status' => ReviewerEvaluation::STATUS_SUBMITTED,
                'submitted_at' => now(),
            ]);

            $form->update(['status' => EvaluationForm::STATUS_IN_REVIEW]);

            $form->load(['reviewerEvaluations.criterionReviews.formCriterion']);

            $result = $this->checkEvaluationCompletion($form);

            return [
                'reviewer_evaluation' => $reviewerEvaluation->load(['criterionReviews.formCriterion']),
                'auto_approved' => ($result['action'] ?? null) === 'auto-approved',
                'deliberation_pending' => ($result['action'] ?? null) === 'deliberation_pending',
                'opinion' => $result['opinion'] ?? null,
                'form' => $form->fresh()->load([
                    'reviewerEvaluations.criterionReviews.formCriterion',
                    'parentForm',
                    'childForms',
                ]),
            ];
        });
    }







//##########################################################################################
//REVENDO LOGICA DE CHECK EVALUATION COMPLETION, POIS NAO ESTAVA FUNCIONANDO COMO ESPERADO##
//##########################################################################################
    // private function checkEvaluationCompletion(EvaluationForm $form): array
    // {
    //     $form = $form->fresh();
    //     $form->loadMissing('reviewerEvaluations');

    //     if (! $form->hasAllSubmitted()) {
    //         return ['action' => 'waiting'];
    //     }

    //     // NC auto-approve: ambos approved
    //     if (
    //         $form->organ === Protocol::ORGAN_NUCLEO
    //         && ! $form->hasAnyNotApproved()
    //     ) {
    //         return $this->autoApprove($form);
    //     }

    //     // NC com needs_deliberation ou not_approved, ou CC sempre → deliberation_pending
    //     $form->update(['status' => EvaluationForm::STATUS_DELIBERATION_PENDING]);
    //     return ['action' => 'deliberation_pending'];
    // }

    // private function autoApprove(EvaluationForm $form): array
    // {
    //     $firstReviewer = $form->reviewerEvaluations()
    //         ->where('status', ReviewerEvaluation::STATUS_SUBMITTED)
    //         ->first();

    //     return $this->processDecision(
    //         $form,
    //         $firstReviewer?->reviewer?->user,
    //         ReviewerEvaluation::DECISION_APPROVED,
    //         null
    //     );
    // }
    //              |
    //              |
    //              |
    //              |
    //          |ABORDAGEM ACTUAL|
    private function checkEvaluationCompletion(EvaluationForm $form): array
    {
        $form = $form->fresh();
        $form->loadMissing('reviewerEvaluations');

        if (! $form->hasAllSubmitted()) {
            return ['action' => 'waiting'];
        }

        // Nota: a via de auto-approve (Núcleo com ambos "approved") fica
        // preservada em autoApprove(), mas deixou de ser chamada aqui.
        // Ambos submetidos, seja qual for a decisão, passam sempre por
        // deliberação — os revisores encontram-se e usam track changes
        // no mesmo documento antes da decisão final.
        //
        // if ($form->organ === Protocol::ORGAN_NUCLEO && ! $form->hasAnyNotApproved()) {
        //     return $this->autoApprove($form);
        // }

        $form->update(['status' => EvaluationForm::STATUS_DELIBERATION_PENDING]);

        return ['action' => 'deliberation_pending'];
    }


    /**
     * Auto-aprova a ficha quando ambos os revisores do Núcleo aprovam,
     * saltando a deliberação. Não é chamado no fluxo actual (ver
     * checkEvaluationCompletion) — mantido para eventual reactivação.
     */
    private function autoApprove(EvaluationForm $form): array
    {
        $firstReviewer = $form->reviewerEvaluations()
            ->where('status', ReviewerEvaluation::STATUS_SUBMITTED)
            ->first();

        return $this->processDecision(
            $form,
            $firstReviewer?->reviewer?->user,
            ReviewerEvaluation::DECISION_APPROVED,
            null
        );
    }        

    public function scheduleDeliberation(EvaluationForm $form, User $secretary, string $date, string $location): EvaluationForm
    {
        return DB::transaction(function () use ($form, $secretary, $date, $location) {
            $form = EvaluationForm::lockForUpdate()->findOrFail($form->id);

            $form->update([
                'deliberation_date' => $date,
                'deliberation_location' => $location,
                'deliberation_scheduled_by' => $secretary->id,
                'status' => EvaluationForm::STATUS_DELIBERATION_SCHEDULED,
            ]);

            return $form->fresh()->load([
                'reviewerEvaluations.reviewer.user:id,name',
            ]);
        });
    }

    public function startDeliberation(EvaluationForm $form, User $reviewer): EvaluationForm
    {
        return DB::transaction(function () use ($form, $reviewer) {
            $form = EvaluationForm::lockForUpdate()->findOrFail($form->id);

            if ($form->status !== EvaluationForm::STATUS_DELIBERATION_SCHEDULED) {
                throw new HttpResponseException(
                    response()->json(['message' => 'A deliberação ainda não foi marcada pela secretaria.'], 422)
                );
            }

            $teacherProfile = $reviewer->teacherProfile;
            $isReviewer = $form->reviewerEvaluations()
                ->where('reviewer_id', $teacherProfile->id)
                ->exists();

            if (! $isReviewer) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Apenas um revisor atribuído pode iniciar a deliberação.'], 403)
                );
            }

            $reviewerEvaluations = $form->reviewerEvaluations()->get();

            if ($reviewerEvaluations->count() < 2) {
                throw new HttpResponseException(
                    response()->json(['message' => 'É necessário ter dois revisores atribuídos.'], 422)
                );
            }

            $primary = $reviewerEvaluations->first();
            $secondary = $reviewerEvaluations->last();

            foreach ($primary->criterionReviews as $primaryReview) {
                $secondaryReview = $secondary->criterionReviews()
                    ->where('evaluation_form_criterion_id', $primaryReview->evaluation_form_criterion_id)
                    ->first();

                if ($secondaryReview && $secondaryReview->comment !== $primaryReview->comment) {
                    $primaryReview->update([
                        'comment' => $primaryReview->comment . "\n---\n" . $secondaryReview->comment,
                    ]);
                }
            }

            $secondary->criterionReviews()->delete();

            $form->update(['status' => EvaluationForm::STATUS_IN_DELIBERATION]);

            return $form->fresh()->load([
                'formCriteria',
                'reviewerEvaluations.criterionReviews.formCriterion',
                'reviewerEvaluations.reviewer.user:id,name',
            ]);
        });
    }

    public function submitDeliberation(EvaluationForm $form, User $decider, string $decision, ?string $conclusionSummary): array
    {
        return DB::transaction(function () use ($form, $decider, $decision, $conclusionSummary) {
            $form = EvaluationForm::lockForUpdate()->findOrFail($form->id);

            if ($form->status !== EvaluationForm::STATUS_IN_DELIBERATION) {
                throw new HttpResponseException(
                    response()->json(['message' => 'A deliberação ainda não foi iniciada.'], 422)
                );
            }

            if ($form->status === EvaluationForm::STATUS_CONCLUDED) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Esta ficha já foi concluída.'], 422)
                );
            }

            $teacherProfile = $decider->teacherProfile;

            if (! $teacherProfile) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Apenas docentes podem submeter a deliberação.'], 403)
                );
            }

            $isReviewer = $form->reviewerEvaluations()
                ->where('reviewer_id', $teacherProfile->id)
                ->exists();

            if (! $isReviewer) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Apenas um revisor atribuído pode submeter a deliberação.'], 403)
                );
            }

            $form->reviewerEvaluations()->update([
                'status' => ReviewerEvaluation::STATUS_SUBMITTED,
                'submitted_at' => now(),
            ]);

            $result = $this->processDecision($form, $decider, $decision, $conclusionSummary);

            return [
                'evaluation_form' => $result['evaluation_form'],
                'opinion' => $result['opinion'],
            ];
        });
    }

    public function decide(EvaluationForm $form, User $decider, string $decision, ?string $conclusionSummary): array
    {
        return DB::transaction(function () use ($form, $decider, $decision, $conclusionSummary) {
            $form = EvaluationForm::lockForUpdate()->findOrFail($form->id);

            if ($form->status !== EvaluationForm::STATUS_DELIBERATED) {
                throw new HttpResponseException(
                    response()->json(['message' => 'A ficha ainda não está pronta para decisão final (reunião não foi encerrada com deliberação).'], 422)
                );
            }
            
            $teacherProfile = $decider->teacherProfile;

            
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

            $allSubmitted = $form->hasAllSubmitted();

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

            return $this->processDecision($form, $decider, $decision, $conclusionSummary);
        });
    }

    private function processDecision(EvaluationForm $form, ?User $decider, string $decision, ?string $conclusionSummary): array
    {
        return DB::transaction(function () use ($form, $decider, $decision, $conclusionSummary) {
            $form = EvaluationForm::lockForUpdate()->findOrFail($form->id);
            $protocol = $form->protocol()->lockForUpdate()->first();

            $form->update([
                'final_decision' => $decision,
                'decided_by' => $decider?->id,
                'decided_at' => now(),
                'status' => EvaluationForm::STATUS_CONCLUDED,
                'conclusion_summary' => $conclusionSummary,
            ]);

            $protocolUpdates = [];
            $flow = null;

            if ($decision === ReviewerEvaluation::DECISION_NOT_APPROVED) {
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

            $oldStatus = $protocol->status;
            $protocol->update($protocolUpdates);

            event(new ProtocolStatusChanged($protocol, $oldStatus, $protocol->status, $decider));

            if ($decision === ReviewerEvaluation::DECISION_APPROVED && $flow && $flow['next_organ_type']) {
                $this->createForProtocol(
                    $protocol->fresh(),
                    [],
                    $decider ?? $protocol->supervisor->user,
                    $flow['next_form_organ'],
                    EvaluationForm::FORM_TYPE_EVALUATION
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
                'issued_by' => $decider?->id ?? $protocol->supervisor?->id,
                'issued_at' => now(),
            ]);

            $opinion->fresh();

            $form->load([
                'protocol',
                'reviewerEvaluations.criterionReviews.formCriterion',
                'childForms',
                'parentForm',
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
                'childForms.reviewerEvaluations' => fn($q) => $q
                    ->where('reviewer_id', $teacherProfile->id),
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
            ->where('form_type', EvaluationForm::FORM_TYPE_EVALUATION)
            ->with([
                'protocol.topic:id,title,status,scientific_area_id,supervisor_id',
                'protocol.topic.scientificArea:id,name,organ_id',
                'protocol.student:id,name,email',
                'protocol.supervisor.user:id,name,email',
                'reviewerEvaluations' => fn($q) => $q->with([
                    'reviewer.user:id,name,email',
                ]),
                'childForms' => fn($q) => $q->with([
                    'reviewerEvaluations.reviewer.user:id,name,email',
                ]),
            ])
            ->latest('created_at')
            ->get();
    }

    public function closeMeeting(EvaluationForm $form, User $user): EvaluationForm
{
    return DB::transaction(function () use ($form, $user) {
        $form = EvaluationForm::lockForUpdate()->findOrFail($form->id);

        if ($form->status !== EvaluationForm::STATUS_IN_DELIBERATION) {
            throw new HttpResponseException(
                response()->json(['message' => 'A reunião não está em andamento.'], 422)
            );
        }

        if (! $form->hasAllSubmitted()) {
            throw new HttpResponseException(
                response()->json(['message' => 'Ambos os revisores devem submeter a decisão antes de encerrar a reunião.'], 422)
            );
        }

        $teacherProfile = $user->teacherProfile;
        $isReviewer = $teacherProfile && $form->reviewerEvaluations()
            ->where('reviewer_id', $teacherProfile->id)
            ->exists();

        if (! $isReviewer) {
            throw new HttpResponseException(
                response()->json(['message' => 'Apenas um revisor atribuído pode encerrar a reunião.'], 403)
            );
        }

        $decisions = $form->reviewerEvaluations()->pluck('decision')->filter()->unique();
        $deliberated = $decisions->count() === 1; // ambos submeteram a mesma decisão

        if ($deliberated) {
            // Houve consenso: fecha a reunião, liberta para a aba de decisão final.
            $form->update(['status' => EvaluationForm::STATUS_DELIBERATED]);
        } else {
            // Sem consenso: volta ao ponto de partida para nova marcação pela secretaria.
            $form->update([
                'status' => EvaluationForm::STATUS_NOT_DELIBERATED,
                'deliberation_date' => null,
                'deliberation_location' => null,
            ]);

            $form->reviewerEvaluations()->update([
                'decision' => null,
                'overall_comment' => null,
                'status' => ReviewerEvaluation::STATUS_PENDING,
                'submitted_at' => null,
            ]);
        }

        return $form->fresh()->load([
            'reviewerEvaluations.reviewer.user:id,name',
            'protocol',
        ]);
    });
}

public function listPendingFinalDecision(User $user): Collection
{
    $teacherProfile = $user->teacherProfile;
    if (! $teacherProfile) return collect();

    return EvaluationForm::query()
        ->where('status', EvaluationForm::STATUS_DELIBERATED) // já não é 'deliberation_concluded'
        ->whereHas('reviewerEvaluations', fn($q) => $q->where('reviewer_id', $teacherProfile->id))
        ->with([
            'protocol.topic:id,title,status',
            'protocol.student:id,name,email',
            'reviewerEvaluations.reviewer.user:id,name',
        ])
        ->latest('created_at')
        ->get();
}


}
