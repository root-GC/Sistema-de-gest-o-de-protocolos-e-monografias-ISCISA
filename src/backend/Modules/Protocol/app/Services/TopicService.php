<?php

namespace Modules\Protocol\app\Services;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Protocol\app\Events\TopicReviewersAssigned;
use Modules\Protocol\app\Models\Topic;
use Modules\Protocol\app\Models\TopicReviewComment;
use Modules\Protocol\app\Models\TopicReviewAssignment;
use Modules\Protocol\app\Models\TopicReviewEvaluation;
use Modules\User\app\Models\StudentProfile;
use Modules\User\app\Models\User;

class TopicService
{
    public function submit(array $data, User $user): array
    {
        $studentProfile = StudentProfile::query()
            ->with('supervisor.user')
            ->where('user_id', $user->id)
            ->first();

        if (! $studentProfile || ! $studentProfile->supervisor) {
            throw new HttpResponseException(
                response()->json([
                    'message' => 'O estudante nao tem supervisor atribuido. A submissao do tema depende da aprovacao do supervisor.',
                ], 409)
            );
        }

        // Impedir nova submissão se houver tema não rejeitado
        $existing = Topic::query()
            ->where('student_id', $user->id)
            ->latest('submitted_at')
            ->first();

        if ($existing && ! in_array($existing->status, Topic::rejectedStatuses(), true)) {
            // Mensagem e payload conforme o status actual
            if ($existing->status === Topic::STATUS_PENDING_SUPERVISOR || $existing->status === 'topic_pending') {
                $message = 'Você já tem um tema aguardando aprovação do supervisor — aguarde a decisão antes de submeter outro.';
            } elseif ($existing->status === Topic::STATUS_PENDING_NUCLEO || $existing->status === 'topic_approved') {
                $message = 'Seu tema já foi aprovado pelo supervisor e está em análise no Nucleo Cientifico — não é possível submeter outro.';
            } elseif ($existing->status === Topic::STATUS_APPROVED_NUCLEO) {
                $message = 'Seu tema anterior já foi aprovado pelo Nucleo Cientifico — não é possível submeter outro.';
            } else {
                $message = 'Já existe um tema associado à sua conta que impede nova submissão.';
            }

            // Devolve 409 Conflict com o tema existente para o frontend tomar decisão
            throw new HttpResponseException(
                response()->json([
                    'message' => $message,
                    'existing_topic' => $existing->load([
                        'scientificArea:id,name',
                        'course:id,name,code',
                        'supervisor.user:id,name,email',
                    ]),
                ], 409)
            );
        }

        // Se chegou aqui, permite submissão (mantém comportamento actual)
        $similarTopics = $this->findSimilarApprovedTopics($data['title']);

        $topic = Topic::create([
            'student_id' => $user->id,
            'supervisor_id' => $studentProfile->supervisor->id,
            'scientific_area_id' => $data['scientific_area_id'],
            'course_id' => $data['course_id'],
            'title' => $data['title'],
            'status' => Topic::STATUS_PENDING_SUPERVISOR,
            'supervisor_status' => Topic::SUPERVISOR_STATUS_PENDING,
            'submitted_at' => now(),
        ]);

        $topic->load([
            'scientificArea:id,name',
            'course:id,name,code',
            'supervisor.user:id,name,email',
        ]);

        return [
            'topic' => $topic,
            'similar_topics' => $similarTopics,
        ];
    }

    public function listForUser(User $user)
    {
        $query = Topic::query()
            ->with([
                'student:id,name,email',
                'supervisor.user:id,name,email',
                'scientificArea:id,name',
                'course:id,name,code',
            ])
            ->latest();

        if ($user->hasPermission('topic.view.all')) {
            return $query->get();
        }

        return $query->where('student_id', $user->id)->get();
    }

    public function listForSupervisor(User $supervisor)
    {
        $teacherProfile = $supervisor->teacherProfile;

        if (! $teacherProfile) {
            return collect();
        }

        return Topic::query()
            ->where('supervisor_id', $teacherProfile->id)
            ->with([
                'student:id,name,email',
                'scientificArea:id,name',
                'course:id,name,code',
            ])
            ->latest('submitted_at')
            ->get();
    }

    private function findSimilarApprovedTopics(string $title): array
    {
        $approvedTopics = Topic::query()
            ->select(['id', 'title'])
            ->whereIn('status', [Topic::STATUS_APPROVED_NUCLEO, 'topic_approved'])
            ->get();

        if ($approvedTopics->isEmpty()) {
            return [];
        }

        return $approvedTopics
            ->map(function (Topic $topic) use ($title) {
                similar_text(mb_strtolower($title), mb_strtolower($topic->title), $percent);

                return [
                    'id' => $topic->id,
                    'title' => $topic->title,
                    'similarity_percent' => round($percent, 2),
                ];
            })
            ->filter(fn(array $item) => $item['similarity_percent'] >= 60)
            ->sortByDesc('similarity_percent')
            ->take(5)
            ->values()
            ->all();
    }

    public function approveBySupervisor(Topic $topic, User $supervisor): Topic
    {
        return DB::transaction(function () use ($topic, $supervisor) {
            // Bloqueia a linha para evitar race condition
            $topic = Topic::lockForUpdate()->findOrFail($topic->id);

            $teacherProfile = $supervisor->teacherProfile;

            if (! $teacherProfile || $topic->supervisor_id !== $teacherProfile->id) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => __('messages.only_supervisor_can_approve'),
                    ], 403)
                );
            }

            // Valida máquina de estados — só pode aprovar se estiver aguardando o supervisor
            if ($topic->status !== Topic::STATUS_PENDING_SUPERVISOR && $topic->status !== 'topic_pending') {
                throw new HttpResponseException(
                    response()->json([
                        'message' => __(
                            'messages.topic_cannot_be_approved',
                            ['current' => $topic->status]
                        ),
                    ], 422)
                );
            }

            // Evita dupla aprovação
            if ($topic->supervisor_status === Topic::SUPERVISOR_STATUS_APPROVED) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => __('messages.topic_already_approved'),
                    ], 409)
                );
            }

            $topic->update([
                'status'                 => Topic::STATUS_PENDING_NUCLEO,
                'supervisor_status'      => Topic::SUPERVISOR_STATUS_APPROVED,
                'supervisor_decision_at' => now(),
            ]);

            // Dispara evento para notificações, logs, integrações event(new TopicApprovedBySupervisor($topic));

            return $topic->load([
                'student:id,name,email',
                'supervisor.user:id,name,email',
                'scientificArea:id,name',
                'course:id,name,code',
            ]);
        });
    }

    public function rejectBySupervisor(Topic $topic, User $supervisor, string $justification = null): Topic
    {
        return DB::transaction(function () use ($topic, $supervisor, $justification) {
            $topic = Topic::lockForUpdate()->findOrFail($topic->id);

            if ($topic->supervisor_id !== $supervisor->teacherProfile?->id) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => 'Apenas o supervisor atribuido pode rejeitar este tema.',
                    ], 403)
                );
            }

            if ($topic->status !== Topic::STATUS_PENDING_SUPERVISOR && $topic->status !== 'topic_pending') {
                throw new HttpResponseException(
                    response()->json([
                        'message' => __('messages.topic_cannot_be_rejected', ['current' => $topic->status]),
                    ], 422)
                );
            }

            $topic->update([
                'status' => Topic::STATUS_REJECTED_SUPERVISOR,
                'supervisor_status' => Topic::SUPERVISOR_STATUS_REJECTED,
                'justification' => $justification,
                'supervisor_decision_at' => now(),
            ]);

            return $topic->load([
                'student:id,name,email',
                'supervisor.user:id,name,email',
                'scientificArea:id,name',
                'course:id,name,code',
            ]);
        });
    }

    /**
     * listForSecretary: Lista todos os temas do núcleo da secretaria.
     *
     * Filtros:
     *   - scientific_area.organ_id === secretary.organ_id
     *   - exclui temas rejeitados pelo supervisor, porque não entram no núcleo
     *
     * Carrega relações: scientific_area, course, reviewAssignments (sem estudante/supervisor — revisão cega).
     */
    public function listForSecretary(User $secretary)
    {
        $secretaryProfile = $secretary->secretaryProfile;

        if (! $secretaryProfile) {
            return collect();
        }

        return Topic::query()
            ->whereHas('scientificArea', fn($q) => $q->where('organ_id', $secretaryProfile->organ_id))
            ->where('status', '!=', Topic::STATUS_REJECTED_SUPERVISOR)
            ->with([
                'scientificArea:id,name,organ_id',
                'course:id,name,code',
                'reviewAssignments.reviewer.user:id,name,email',
                'reviewAssignments.evaluation.comment:id,content,status,created_at',
            ])
            ->latest('submitted_at')
            ->get();
    }

    /**
     * getEligibleReviewers: Retorna docentes elegíveis para avaliar um tema.
     *
     * Elegibilidade:
     *   - Docente na mesma área científica / núcleo do tema
     *   - Não é o supervisor do tema
     *   - Ainda não foi atribuído como revisor deste tema
     */
    public function getEligibleReviewers(Topic $topic)
    {
        $query = $this->eligibleReviewersQuery($topic);

        if (! $query) {
            return collect();
        }

        $assignedReviewerIds = $topic->reviewAssignments()
            ->pluck('reviewer_id')
            ->toArray();

        return $query
            ->when($assignedReviewerIds !== [], fn($q) => $q->whereNotIn('teacher_profiles.id', $assignedReviewerIds))
            ->select(
                'teacher_profiles.id',
                'users.name',
                'users.email',
                'scientific_areas.name as scientific_area_name'
            )
            ->orderBy('users.name')
            ->get();
    }

    /**
     * assignReviewers: Atribui um ou mais avaliadores a um tema.
     *
     * Processo:
     *   1. Valida que o tema está em topic_pending_nucleo
     *   2. Valida que cada avaliador está no mesmo núcleo
     *   3. Cria TopicReviewAssignment para cada avaliador
     *   4. Se há avaliadores atribuídos, transiciona tema para topic_assigned_for_review
     *
     * @param Topic $topic
     * @param array $reviewerIds Array de teacher_profile IDs
     * @param User $secretary User que fez a atribuição
     * @return Topic Tema actualizado com assignments carregados
     */
    public function assignReviewers(Topic $topic, array $reviewerIds, User $secretary): Topic
    {
        return DB::transaction(function () use ($topic, $reviewerIds, $secretary) {
            $topic = Topic::lockForUpdate()->findOrFail($topic->id);
            $secretaryProfile = $secretary->secretaryProfile;

            if (! $secretaryProfile) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => 'Utilizador não é uma secretaria.',
                    ], 403)
                );
            }

            // Valida estado do tema
            if ($topic->status !== Topic::STATUS_PENDING_NUCLEO) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => 'O tema não está em estado de atribuição de avaliadores.',
                    ], 422)
                );
            }

            // Valida núcleo do tema
            $topicOrganId = $topic->scientificArea?->organ_id;
            if ($topicOrganId !== $secretaryProfile->organ_id) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => 'Secretaria não tem permissão para atribuir avaliadores a este tema.',
                    ], 403)
                );
            }

            // Valida cada revisor e cria atribuição
            foreach ($reviewerIds as $reviewerId) {
                if ((int) $reviewerId === (int) $topic->supervisor_id) {
                    throw new HttpResponseException(
                        response()->json([
                            'message' => 'O supervisor do tema não pode ser atribuído como avaliador.',
                        ], 422)
                    );
                }

                $reviewer = $this->eligibleReviewersQuery($topic)
                    ?->where('teacher_profiles.id', $reviewerId)
                    ->select('teacher_profiles.id')
                    ->first();

                if (! $reviewer) {
                    throw new HttpResponseException(
                        response()->json([
                            'message' => "Avaliador {$reviewerId} não pertence ao núcleo do tema ou não é elegível.",
                        ], 422)
                    );
                }

                // Verifica se já foi atribuído
                $existing = $topic->reviewAssignments()
                    ->where('reviewer_id', $reviewerId)
                    ->exists();

                if ($existing) {
                    throw new HttpResponseException(
                        response()->json([
                            'message' => "Avaliador {$reviewerId} já foi atribuído a este tema.",
                        ], 409)
                    );
                }

                // Cria atribuição
                $topic->reviewAssignments()->create([
                    'reviewer_id' => $reviewerId,
                    'assigned_by_id' => $secretary->id,
                    'assigned_at' => now(),
                ]);
            }

            $assignedReviewerIds = $topic->reviewAssignments()
                ->pluck('reviewer_id')
                ->values()
                ->all();

            if ($assignedReviewerIds !== []) {
                $topic->update([
                    'status' => Topic::STATUS_ASSIGNED,
                ]);

                event(new TopicReviewersAssigned($topic->fresh(), $assignedReviewerIds));
            }

            return $topic->load([
                'scientificArea:id,name,organ_id',
                'course:id,name,code',
                'reviewAssignments.reviewer.user:id,name,email',
                'reviewAssignments.evaluation:id,assignment_id,decision,evaluated_at',
            ]);
        });
    }

    public function listForReviewer(User $reviewer)
    {
        $teacherProfile = $reviewer->teacherProfile;

        if (! $teacherProfile) {
            return collect();
        }

        return Topic::query()
            ->whereHas('reviewAssignments', fn($query) => $query->where('reviewer_id', $teacherProfile->id))
            ->with([
                'scientificArea:id,name',
                'course:id,name,code',
                'reviewAssignments' => fn($query) => $query
                    ->where('reviewer_id', $teacherProfile->id)
                    ->with('evaluation.comment'),
            ])
            ->latest('submitted_at')
            ->get();
    }

    public function submitEvaluation(Topic $topic, User $reviewer, array $data): array
    {
        return DB::transaction(function () use ($topic, $reviewer, $data) {
            $topic = Topic::lockForUpdate()->findOrFail($topic->id);
            $teacherProfile = $reviewer->teacherProfile;

            if (! $teacherProfile) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => 'Utilizador não é um avaliador válido.',
                    ], 403)
                );
            }

            if (! $reviewer->hasPermission('protocol.evaluate') && ! $reviewer->hasPermission('evaluation.create')) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => 'Utilizador não tem permissão para avaliar temas.',
                    ], 403)
                );
            }

            if (! in_array($topic->status, [Topic::STATUS_ASSIGNED, Topic::STATUS_IN_REVIEW], true)) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => 'O tema ainda não está pronto para avaliação.',
                    ], 422)
                );
            }

            $assignment = $topic->reviewAssignments()
                ->where('reviewer_id', $teacherProfile->id)
                ->first();

            if (! $assignment) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => 'Este avaliador não foi atribuído a este tema.',
                    ], 403)
                );
            }

            $evaluation = TopicReviewEvaluation::query()->firstOrNew([
                'assignment_id' => $assignment->id,
            ]);

            $evaluation->topic_id = $topic->id;
            $evaluation->reviewer_id = $teacherProfile->id;
            $evaluation->comment_id = $data['comment_id'] ?? $evaluation->comment_id;
            $evaluation->decision = $data['decision'];
            $evaluation->evaluated_at = now();

            $evaluation->save();

            $hasPendingEvaluations = $topic->reviewAssignments()
                ->whereDoesntHave('evaluation')
                ->orWhereHas('evaluation', fn($query) => $query->whereNull('decision'))
                ->exists();

            $finalDecision = null;

            if (! $hasPendingEvaluations) {
                $decisions = $topic->reviewAssignments()
                    ->with('evaluation')
                    ->get()
                    ->pluck('evaluation.decision')
                    ->filter()
                    ->all();

                $finalDecision = in_array(TopicReviewEvaluation::DECISION_REJECTED, $decisions, true)
                    ? Topic::STATUS_REJECTED_NUCLEO
                    : Topic::STATUS_APPROVED_NUCLEO;
            }

            $topic->update([
                'status' => $finalDecision ?: Topic::STATUS_IN_REVIEW,
            ]);

            return [
                'topic' => $topic->load([
                    'scientificArea:id,name',
                    'course:id,name,code',
                    'reviewAssignments' => fn($query) => $query
                        ->where('reviewer_id', $teacherProfile->id)
                        ->with('evaluation.comment'),
                ]),
                'evaluation' => $evaluation,
            ];
        });
    }

    public function submitReviewComment(Topic $topic, User $reviewer, array $data): array
    {
        return DB::transaction(function () use ($topic, $reviewer, $data) {
            $topic = Topic::lockForUpdate()->findOrFail($topic->id);
            $teacherProfile = $reviewer->teacherProfile;

            if (! $teacherProfile) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => 'Utilizador não é um avaliador válido.',
                    ], 403)
                );
            }

            if (! $reviewer->hasPermission('protocol.evaluate') && ! $reviewer->hasPermission('evaluation.create')) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => 'Utilizador não tem permissão para comentar temas.',
                    ], 403)
                );
            }

            if (! in_array($topic->status, [Topic::STATUS_ASSIGNED, Topic::STATUS_IN_REVIEW], true)) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => 'O tema ainda não está pronto para comentário.',
                    ], 422)
                );
            }

            $assignment = $topic->reviewAssignments()
                ->where('reviewer_id', $teacherProfile->id)
                ->first();

            if (! $assignment) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => 'Este avaliador não foi atribuído a este tema.',
                    ], 403)
                );
            }

            $comment = TopicReviewComment::create([
                'user_id' => $reviewer->id,
                'topic_id' => $topic->id,
                'content' => $data['content'],
                'status' => TopicReviewComment::STATUS_ACTIVE,
            ]);

            $evaluation = $topic->reviewAssignments()
                ->where('reviewer_id', $teacherProfile->id)
                ->with('evaluation.comment')
                ->first()
                ?->evaluation;

            if ($evaluation) {
                $evaluation->comment_id = $comment->id;
                $evaluation->save();
                $evaluation->load('comment');
            }

            return [
                'comment' => $comment->load('user:id,name,email'),
                'evaluation' => $evaluation,
                'topic' => $topic->load([
                    'scientificArea:id,name',
                    'course:id,name,code',
                    'reviewAssignments' => fn($query) => $query
                        ->where('reviewer_id', $teacherProfile->id)
                        ->with('evaluation.comment'),
                ]),
            ];
        });
    }

    /**
     * listCommentsForTopic: Lista os comentários de um tema para o revisor atribuído.
     *
     * Filtros opcionais:
     *   - search: pesquisa textual no conteúdo
     *   - order: asc|desc (por created_at)
     *   - status: active|inactive
     */
    public function listCommentsForTopic(Topic $topic, User $reviewer, array $filters = [])
    {
        $teacherProfile = $reviewer->teacherProfile;

        if (! $teacherProfile) {
            return collect();
        }

        $assigned = $topic->reviewAssignments()
            ->where('reviewer_id', $teacherProfile->id)
            ->exists();

        if (! $assigned) {
            throw new HttpResponseException(
                response()->json([
                    'message' => 'Este revisor não foi atribuído a este tema.',
                ], 403)
            );
        }

        $query = $topic->reviewComments()
            ->with('user:id,name,email')
            ->when(($filters['status'] ?? null), fn($builder, $status) => $builder->where('status', $status))
            ->search($filters['search'] ?? null)
            ->ordered($filters['order'] ?? 'desc');

        return $query->get();
    }

    /**
     * Query base de docentes elegíveis para revisão de um tema.
     *
     * Restrições:
     *   - Mesma área científica e órgão (núcleo) do tema
     *   - Exclui o supervisor do tema
     */
    private function eligibleReviewersQuery(Topic $topic): ?\Illuminate\Database\Query\Builder
    {
        $topic->loadMissing('scientificArea:id,organ_id');

        $topicOrganId = $topic->scientificArea?->organ_id;

        if (! $topicOrganId || ! $topic->scientific_area_id) {
            return null;
        }

        return DB::table('teacher_profiles')
            ->join('scientific_areas', 'teacher_profiles.scientific_area_id', '=', 'scientific_areas.id')
            ->join('users', 'teacher_profiles.user_id', '=', 'users.id')
            ->where('scientific_areas.organ_id', $topicOrganId)
            ->where('teacher_profiles.scientific_area_id', $topic->scientific_area_id)
            ->whereNull('teacher_profiles.deleted_at')
            ->whereNull('users.deleted_at')
            ->when($topic->supervisor_id, fn($q) => $q->where('teacher_profiles.id', '!=', $topic->supervisor_id));
    }
}
