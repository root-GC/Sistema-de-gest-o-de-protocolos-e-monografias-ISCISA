<?php

namespace Modules\Protocol\app\Services;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Protocol\app\Events\ProtocolApproved;
use Modules\Protocol\app\Events\ProtocolStatusChanged;
use Modules\Protocol\app\Models\EvaluationCriterion;
use Modules\Protocol\app\Models\EvaluationCriterionReview;
use Modules\Protocol\app\Models\EvaluationForm;
use Modules\Protocol\app\Models\EvaluationFormCriterion;
use Modules\Protocol\app\Models\Opinion;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\ProtocolReviewAssignment;
use Modules\Protocol\app\Models\ReviewerEvaluation;
use Modules\Protocol\app\Services\ProtocolHistoryService;
use Modules\User\app\Models\Organ;
use Modules\User\app\Models\User;

class EvaluationService
{
    private function isScientificCommitteeForm(EvaluationForm $form): bool
    {
        return $form->organ === Protocol::ORGAN_COMITE_CIENTIFICO;
    }

    private function isBioeticaForm(EvaluationForm $form): bool
    {
        return $form->organ === Protocol::ORGAN_COMITE_BIOETICA;
    }

    private function isSharedCommitteeForm(EvaluationForm $form): bool
    {
        return in_array($form->organ, [
            Protocol::ORGAN_COMITE_CIENTIFICO,
            Protocol::ORGAN_COMITE_BIOETICA,
        ], true);
    }

    private function organIdForForm(EvaluationForm $form, ?Protocol $protocol = null): ?int
    {
        $organType = Protocol::organTypeFromFormOrgan($form->organ);

        if (! $organType) {
            return $protocol?->current_organ_id;
        }

        $protocol?->loadMissing('currentOrgan');

        if ($protocol?->currentOrgan && $protocol->currentOrgan->type === $organType) {
            return $protocol->currentOrgan->id;
        }

        return Organ::query()
            ->where('type', $organType)
            ->value('id');
    }

    private function recordProtocolHistory(
        EvaluationForm $form,
        string $action,
        ?User $actor,
        string $description,
        array $metadata = [],
        ?Protocol $protocol = null,
        ?int $organId = null,
        ?string $oldStatus = null,
        ?string $newStatus = null,
    ): void {
        $protocol ??= $form->protocol()->first();

        if (! $protocol) {
            return;
        }

        app(ProtocolHistoryService::class)->record(
            $protocol,
            $action,
            $actor,
            $organId ?? $this->organIdForForm($form, $protocol),
            $oldStatus ?? $protocol->status,
            $newStatus ?? $protocol->status,
            $description,
            array_merge([
                'evaluation_form_id' => $form->id,
                'form_organ' => $form->organ,
                'form_status' => $form->status,
            ], $metadata)
        );
    }

    private function isPrimaryReviewer(EvaluationForm $form, User $user): bool
    {
        $teacherProfile = $user->teacherProfile;

        if (! $teacherProfile) {
            return false;
        }

        return $form->reviewerEvaluations()
            ->where('reviewer_id', $teacherProfile->id)
            ->whereHas('protocolReviewAssignment', fn($query) => $query->where('is_primary', true))
            ->exists();
    }

    private function reviewerEvaluationFor(EvaluationForm $form, User $user): ?ReviewerEvaluation
    {
        $teacherProfile = $user->teacherProfile;

        if (! $teacherProfile) {
            return null;
        }

        return $form->reviewerEvaluations()
            ->where('reviewer_id', $teacherProfile->id)
            ->first();
    }

    private function sharedReviewerEvaluation(EvaluationForm $form): ReviewerEvaluation
    {
        $reviewerEvaluation = $form->reviewerEvaluations()
            ->with('protocolReviewAssignment')
            ->orderByDesc(
                ProtocolReviewAssignment::query()
                    ->select('is_primary')
                    ->whereColumn('protocol_review_assignments.id', 'reviewer_evaluations.protocol_review_assignment_id')
                    ->limit(1)
            )
            ->orderBy('id')
            ->first();

        if (! $reviewerEvaluation) {
            throw new HttpResponseException(
                response()->json(['message' => 'Nenhum revisor encontrado nesta ficha.'], 403)
            );
        }

        return $reviewerEvaluation;
    }

    public function createForProtocol(Protocol $protocol, array $reviewerIds, User $secretary, string $organ = 'nucleo', string $formType = EvaluationForm::FORM_TYPE_EVALUATION): EvaluationForm
    {
        return DB::transaction(function () use ($protocol, $reviewerIds, $secretary, $organ, $formType) {
            $protocol = Protocol::lockForUpdate()->findOrFail($protocol->id);
            $reviewerIds = collect($reviewerIds)
                ->filter()
                ->map(fn($id) => (int) $id)
                ->unique()
                ->values()
                ->toArray();
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

            $assignmentsByReviewer = collect();

            if ($reviewerIds !== []) {
                $assignments = ProtocolReviewAssignment::query()
                    ->where('protocol_id', $protocol->id)
                    ->where('organ_id', $protocol->current_organ_id)
                    ->where(
                        fn($query) => $query
                            ->whereIn('reviewer_one', $reviewerIds)
                            ->orWhereIn('reviewer_two', $reviewerIds)
                    )
                    ->latest('assigned_at')
                    ->get();

                if ($assignments->isEmpty()) {
                    throw new HttpResponseException(
                        response()->json(['message' => 'Nenhuma atribuição de revisores encontrada para este protocolo neste orgao.'], 422)
                    );
                }

                foreach ($assignments as $assignment) {
                    if ($assignment->reviewer_one && in_array((int) $assignment->reviewer_one, $reviewerIds, true)) {
                        $assignmentsByReviewer->put((int) $assignment->reviewer_one, $assignment);
                    }

                    if ($assignment->reviewer_two && in_array((int) $assignment->reviewer_two, $reviewerIds, true)) {
                        $assignmentsByReviewer->put((int) $assignment->reviewer_two, $assignment);
                    }
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
                        'protocol_review_assignment_id' => $assignmentsByReviewer->get((int) $reviewerId)?->id,
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
                'protocolReviewAssignment',
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

            if ($this->isSharedCommitteeForm($form)) {
                $reviewerEvaluation = $this->reviewerEvaluationFor($form, $user);

                if (! $reviewerEvaluation) {
                    throw new HttpResponseException(
                        response()->json(['message' => 'Não está atribuído como revisor desta ficha.'], 403)
                    );
                }

                if ($form->status === EvaluationForm::STATUS_CONCLUDED) {
                    throw new HttpResponseException(
                        response()->json(['message' => 'Esta ficha já foi concluída.'], 422)
                    );
                }

                if ($form->status !== EvaluationForm::STATUS_IN_DELIBERATION) {
                    throw new HttpResponseException(
                        response()->json(['message' => 'A ficha só fica disponível durante a reunião de deliberação.'], 422)
                    );
                }

                if ($this->isBioeticaForm($form) && ! $this->isPrimaryReviewer($form, $user)) {
                    throw new HttpResponseException(
                        response()->json(['message' => 'Apenas o revisor principal do Comité de Bioética pode preencher esta ficha.'], 403)
                    );
                }

                $sharedEvaluation = $this->sharedReviewerEvaluation($form);

                $criterionReview = EvaluationCriterionReview::query()->updateOrCreate(
                    [
                        'reviewer_evaluation_id' => $sharedEvaluation->id,
                        'evaluation_form_criterion_id' => $formCriterion->id,
                    ],
                    ['comment' => $comment]
                );

                if ($reviewerEvaluation->status === ReviewerEvaluation::STATUS_PENDING) {
                    $reviewerEvaluation->update(['status' => ReviewerEvaluation::STATUS_IN_PROGRESS]);
                }

                return $criterionReview->load('formCriterion');
            }

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
        if ($this->isSharedCommitteeForm($form)) {
            return $this->markAsReviewed($form, $reviewer, $decision, $overallComment);
        }

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
            $protocol = $form->protocol()->first();

            $this->recordProtocolHistory(
                $form,
                'reviewer_submitted_evaluation',
                $reviewer,
                'Revisor submeteu avaliacao do protocolo.',
                [
                    'reviewer_id' => $teacherProfile->id,
                    'decision' => $decision,
                ],
                $protocol
            );

            if (($result['action'] ?? null) === 'deliberation_pending') {
                $this->recordProtocolHistory(
                    $form,
                    'deliberation_pending',
                    $reviewer,
                    'Todos os revisores avaliaram. Protocolo aguardando marcacao de deliberacao.',
                    [],
                    $protocol
                );
            }

            return [
                'reviewer_evaluation' => $reviewerEvaluation->load(['criterionReviews.formCriterion']),
                'auto_approved' => ($result['action'] ?? null) === 'auto-approved',
                'deliberation_pending' => ($result['action'] ?? null) === 'deliberation_pending',
                'opinion' => $result['opinion'] ?? null,
                'form' => $form->fresh()->load([
                    'reviewerEvaluations.criterionReviews.formCriterion',
                    'reviewerEvaluations.protocolReviewAssignment',
                    'reviewerEvaluations.reviewer.user:id,name',
                    'parentForm',
                    'childForms',
                ]),
            ];
        });
    }

    public function markAsReviewed(EvaluationForm $form, User $reviewer, string $decision, ?string $overallComment = null): array
    {
        return DB::transaction(function () use ($form, $reviewer, $decision, $overallComment) {
            $form = EvaluationForm::lockForUpdate()->findOrFail($form->id);

            if (! $this->isSharedCommitteeForm($form)) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Esta acção está disponível apenas para fichas do Comité Científico e Comité de Bioética.'], 422)
                );
            }

            if (! in_array($form->status, [
                EvaluationForm::STATUS_PENDING_REVIEW,
                EvaluationForm::STATUS_IN_REVIEW,
                EvaluationForm::STATUS_NOT_DELIBERATED,
            ], true)) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Esta ficha já avançou para deliberação.'], 422)
                );
            }

            $reviewerEvaluation = $this->reviewerEvaluationFor($form, $reviewer);

            if (! $reviewerEvaluation) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Não está atribuído como revisor desta ficha.'], 403)
                );
            }

            if ($reviewerEvaluation->status === ReviewerEvaluation::STATUS_SUBMITTED) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Esta revisão já foi marcada como avaliada.'], 422)
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
            $protocol = $form->protocol()->first();

            $this->recordProtocolHistory(
                $form,
                'reviewer_marked_evaluated',
                $reviewer,
                'Revisor marcou a revisao como avaliada.',
                [
                    'reviewer_id' => $reviewerEvaluation->reviewer_id,
                    'decision' => $decision,
                ],
                $protocol
            );

            if (($result['action'] ?? null) === 'deliberation_pending') {
                $this->recordProtocolHistory(
                    $form,
                    'deliberation_pending',
                    $reviewer,
                    'Todos os revisores avaliaram. Protocolo aguardando marcacao de deliberacao.',
                    [],
                    $protocol
                );
            }

            return [
                'reviewer_evaluation' => $reviewerEvaluation->fresh()->load(['criterionReviews.formCriterion']),
                'auto_approved' => false,
                'deliberation_pending' => ($result['action'] ?? null) === 'deliberation_pending',
                'opinion' => null,
                'form' => $form->fresh()->load([
                    'reviewerEvaluations.criterionReviews.formCriterion',
                    'reviewerEvaluations.protocolReviewAssignment',
                    'reviewerEvaluations.reviewer.user:id,name',
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
            ]);

            $this->recordProtocolHistory(
                $form,
                'deliberation_scheduled',
                $secretary,
                'Deliberacao marcada pela secretaria.',
                [
                    'deliberation_date' => $date,
                    'deliberation_location' => $location,
                ]
            );

            return $form->fresh()->load([
                'reviewerEvaluations.reviewer.user:id,name',
                'reviewerEvaluations.protocolReviewAssignment',
            ]);
        });
    }

    public function startDeliberation(EvaluationForm $form, User $reviewer): EvaluationForm
    {
        return DB::transaction(function () use ($form, $reviewer) {
            $form = EvaluationForm::lockForUpdate()->findOrFail($form->id);

            if (! in_array($form->status, [
                EvaluationForm::STATUS_PENDING_REVIEW,
                EvaluationForm::STATUS_IN_REVIEW,
                EvaluationForm::STATUS_DELIBERATION_PENDING,
                EvaluationForm::STATUS_NOT_DELIBERATED,
                EvaluationForm::STATUS_DELIBERATION_SCHEDULED,
            ], true)) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Esta ficha não pode entrar em deliberação no estado actual.'], 422)
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

            $reviewerEvaluations = $form->reviewerEvaluations()
                ->with(['protocolReviewAssignment', 'criterionReviews'])
                ->get();

            if ($reviewerEvaluations->count() < 2) {
                throw new HttpResponseException(
                    response()->json(['message' => 'É necessário ter pelo menos dois revisores atribuídos.'], 422)
                );
            }

            if ($this->isBioeticaForm($form) && ! $this->isPrimaryReviewer($form, $reviewer)) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Apenas o revisor principal do Comité de Bioética pode iniciar a deliberação.'], 403)
                );
            }

            $primary = $this->sharedReviewerEvaluation($form);
            $secondaryEvaluations = $reviewerEvaluations
                ->where('id', '!=', $primary->id)
                ->values();

            foreach ($primary->criterionReviews as $primaryReview) {
                foreach ($secondaryEvaluations as $secondaryEvaluation) {
                    $secondaryReview = $secondaryEvaluation->criterionReviews
                        ->where('evaluation_form_criterion_id', $primaryReview->evaluation_form_criterion_id)
                        ->first();

                    if ($secondaryReview && $secondaryReview->comment !== $primaryReview->comment) {
                        $primaryReview->update([
                            'comment' => $primaryReview->comment . "\n---\n" . $secondaryReview->comment,
                        ]);
                    }
                }
            }

            foreach ($secondaryEvaluations as $secondaryEvaluation) {
                $secondaryEvaluation->criterionReviews()->delete();
            }

            $form->update(['status' => EvaluationForm::STATUS_IN_DELIBERATION]);

            $this->recordProtocolHistory(
                $form,
                'deliberation_started',
                $reviewer,
                'Reuniao de deliberacao iniciada.',
                [
                    'reviewer_id' => $teacherProfile->id,
                ]
            );

            return $form->fresh()->load([
                'formCriteria',
                'reviewerEvaluations.criterionReviews.formCriterion',
                'reviewerEvaluations.protocolReviewAssignment',
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

            if ($this->isBioeticaForm($form) && ! $this->isPrimaryReviewer($form, $decider)) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Apenas o revisor principal do Comité de Bioética pode submeter a ficha de deliberação.'], 403)
                );
            }

            $form->reviewerEvaluations()->update([
                'status' => ReviewerEvaluation::STATUS_SUBMITTED,
                'submitted_at' => now(),
            ]);

            if ($this->isSharedCommitteeForm($form)) {
                $form->update([
                    'harmonized_decision' => $decision,
                    'harmonized_at' => now(),
                    'conclusion_summary' => $conclusionSummary,
                    'status' => EvaluationForm::STATUS_DELIBERATED,
                ]);

                $this->recordProtocolHistory(
                    $form,
                    'deliberation_closed',
                    $decider,
                    'Ficha de deliberacao submetida.',
                    [
                        'decision' => $decision,
                        'conclusion_summary' => $conclusionSummary,
                    ]
                );

                return [
                    'evaluation_form' => $form->fresh()->load([
                        'protocol',
                        'reviewerEvaluations.criterionReviews.formCriterion',
                        'reviewerEvaluations.protocolReviewAssignment',
                        'reviewerEvaluations.reviewer.user:id,name',
                    ]),
                    'opinion' => null,
                ];
            }

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

            if ($this->isBioeticaForm($form) && ! $this->isPrimaryReviewer($form, $decider)) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Apenas o revisor principal do Comité de Bioética pode tomar a decisão final.'], 403)
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
            $opinionVersion = $form->version;
            $nextVersionLabel = null;

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

                $signaturePendingStatus = match ($form->organ) {
                    Protocol::ORGAN_COMITE_CIENTIFICO => Protocol::STATUS_PARECER_PENDING_CC_SIGNATURE,
                    Protocol::ORGAN_COMITE_BIOETICA => Protocol::STATUS_PARECER_PENDING_CIBS_SIGNATURE,
                    default => null,
                };

                if ($signaturePendingStatus) {
                    // O parecer do comité precisa de ser assinado pela secretaria
                    // antes de seguir para o próximo órgão / aprovação final.
                    $protocolUpdates['status'] = $signaturePendingStatus;
                } else {
                    $protocolUpdates['status'] = $flow['next_status'];

                    if ($flow['next_organ_type'] === Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE) {
                        $protocolUpdates['status'] = Protocol::STATUS_DOCUMENTS_PENDING_CIBS;
                    }

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
                        $versionNumber = 1;
                        $nextVersionLabel = Protocol::organVersionLabel($flow['next_organ_type'], $versionNumber);

                        $protocolUpdates[$field] = $versionNumber;
                        $protocolUpdates['version'] = $nextVersionLabel;
                    } else {
                        $protocolUpdates['version'] = 'APROVADO';
                    }
                }
            }

            $oldStatus = $protocol->status;
            $oldOrganId = $protocol->current_organ_id;
            $protocol->update($protocolUpdates);

            if ($decision === ReviewerEvaluation::DECISION_NOT_APPROVED) {
                app(ProtocolService::class)->markLatestDocumentRejected($protocol, $decider?->id);
            }

            if ($decision === ReviewerEvaluation::DECISION_APPROVED && $nextVersionLabel) {
                app(ProtocolService::class)->syncLatestDocumentVersionLabel($protocol, $nextVersionLabel);
            }

            $this->recordProtocolHistory(
                $form,
                $decision === ReviewerEvaluation::DECISION_APPROVED ? 'approved' : 'rejected',
                $decider,
                $decision === ReviewerEvaluation::DECISION_APPROVED
                    ? 'Protocolo aprovado pelo orgao.'
                    : 'Protocolo nao aprovado pelo orgao.',
                [
                    'decision' => $decision,
                    'conclusion_summary' => $conclusionSummary,
                    'opinion_version' => $opinionVersion,
                ],
                $protocol,
                $oldOrganId,
                $oldStatus,
                $protocol->status
            );

            event(new ProtocolStatusChanged($protocol, $oldStatus, $protocol->status, $decider));

            if ($decision === ReviewerEvaluation::DECISION_APPROVED && $protocol->status === Protocol::STATUS_APPROVED_FINAL) {
                $protocol->loadMissing('topic');

                event(new ProtocolApproved(
                    submissionId: $protocol->id,
                    studentId: $protocol->topic->student_id,
                    supervisorId: $protocol->topic->supervisor_id,
                    title: $protocol->topic->title,
                    courseId: $protocol->topic->course_id,
                    scientificAreaId: $protocol->topic->scientific_area_id,
                ));
            }

            if ($decision === ReviewerEvaluation::DECISION_APPROVED && ! $signaturePendingStatus && $flow && $flow['next_organ_type']) {
                $this->recordProtocolHistory(
                    $form,
                    'forwarded',
                    $decider,
                    'Protocolo encaminhado ao proximo orgao.',
                    [
                        'from_organ_id' => $oldOrganId,
                        'to_organ_id' => $protocol->current_organ_id,
                        'next_form_organ' => $flow['next_form_organ'],
                        'next_version' => $nextVersionLabel,
                    ],
                    $protocol,
                    $protocol->current_organ_id,
                    $oldStatus,
                    $protocol->status
                );

                $this->createForProtocol(
                    $protocol->fresh(),
                    [],
                    $decider ?? $protocol->supervisor->user,
                    $flow['next_form_organ'],
                    EvaluationForm::FORM_TYPE_EVALUATION
                );
            }

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
                'reviewerEvaluations.protocolReviewAssignment',
                'reviewerEvaluations.reviewer.user:id,name',
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
                    ->with(['criterionReviews.formCriterion', 'protocolReviewAssignment']),
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
                    'protocolReviewAssignment',
                    'reviewer.user:id,name,email',
                ]),
                'childForms' => fn($q) => $q->with([
                    'reviewerEvaluations.reviewer.user:id,name,email',
                ]),
            ])
            ->latest('created_at')
            ->get();
    }

    public function closeMeeting(EvaluationForm $form, User $user, ?string $result = null): EvaluationForm
    {
        return DB::transaction(function () use ($form, $user, $result) {
            $form = EvaluationForm::lockForUpdate()->findOrFail($form->id);

            if ($form->status !== EvaluationForm::STATUS_IN_DELIBERATION) {
                throw new HttpResponseException(
                    response()->json(['message' => 'A reunião não está em andamento.'], 422)
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

            if ($this->isBioeticaForm($form) && ! $this->isPrimaryReviewer($form, $user)) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Apenas o revisor principal do Comité de Bioética pode encerrar a reunião.'], 403)
                );
            }

            $decisions = $form->reviewerEvaluations()->pluck('decision')->filter()->unique();
            $deliberated = $result
                ? $result === EvaluationForm::STATUS_DELIBERATED
                : $decisions->count() === 1; // compatibilidade com o fluxo antigo

            if ($deliberated) {
                // Houve consenso: fecha a reunião, liberta para a aba de decisão final.
                $form->update(['status' => EvaluationForm::STATUS_DELIBERATED]);
            } else {
                // Sem consenso: volta ao ponto de partida para nova marcação pela secretaria.
                $form->update([
                    'status' => EvaluationForm::STATUS_NOT_DELIBERATED,
                    'deliberation_date' => null,
                    'deliberation_location' => null,
                    'deliberation_scheduled_by' => null,
                ]);

                if (! $this->isSharedCommitteeForm($form)) {
                    $form->reviewerEvaluations()->update([
                        'decision' => null,
                        'overall_comment' => null,
                        'status' => ReviewerEvaluation::STATUS_PENDING,
                        'submitted_at' => null,
                    ]);
                }
            }

            $this->recordProtocolHistory(
                $form,
                'deliberation_closed',
                $user,
                $deliberated
                    ? 'Reuniao encerrada com deliberacao.'
                    : 'Reuniao encerrada sem deliberacao.',
                [
                    'result' => $deliberated
                        ? EvaluationForm::STATUS_DELIBERATED
                        : EvaluationForm::STATUS_NOT_DELIBERATED,
                ]
            );

            return $form->fresh()->load([
                'reviewerEvaluations.reviewer.user:id,name',
                'reviewerEvaluations.protocolReviewAssignment',
                'protocol',
            ]);
        });
    }

    public function listPendingFinalDecision(User $user, ?string $organ = null): Collection
    {
        $teacherProfile = $user->teacherProfile;
        if (! $teacherProfile) return collect();

        return EvaluationForm::query()
            ->where('status', EvaluationForm::STATUS_DELIBERATED) // já não é 'deliberation_concluded'
            ->when($organ, fn($q) => $q->where('organ', $organ))
            ->whereHas('reviewerEvaluations', function ($query) use ($teacherProfile, $organ) {
                $query->where('reviewer_id', $teacherProfile->id)
                    ->when(
                        $organ === Protocol::ORGAN_COMITE_BIOETICA,
                        fn($q) => $q->whereHas('protocolReviewAssignment', fn($assignmentQuery) => $assignmentQuery->where('is_primary', true))
                    );
            })
            ->with([
                'protocol.topic:id,title,status',
                'protocol.student:id,name,email',
                'reviewerEvaluations.protocolReviewAssignment',
                'reviewerEvaluations.reviewer.user:id,name',
            ])
            ->latest('created_at')
            ->get();
    }
}
