<?php

namespace Modules\Protocol\app\Services;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Modules\Protocol\app\Events\TopicReviewersAssigned;
use Modules\Protocol\app\Events\TopicStatusChanged;
use Modules\Protocol\app\Models\EvaluationForm;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\ReviewerEvaluation;
use Modules\Protocol\app\Models\Topic;
use Modules\Protocol\app\Models\TopicReviewComment;
use Modules\Protocol\app\Models\TopicReviewAssignment;
use Modules\Protocol\app\Models\TopicReviewEvaluation;
use Modules\User\app\Models\StudentProfile;
use Modules\User\app\Models\User;


class TopicService
{
    public function submit(array $data, User $user, ?UploadedFile $document = null): array
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
            if ($existing->status === Topic::STATUS_PENDING_SUPERVISOR || $existing->status === 'topic_pending') {
                $message = 'Você já tem um tema aguardando aprovação do supervisor — aguarde a decisão antes de submeter outro.';
            } elseif ($existing->status === Topic::STATUS_PENDING_NUCLEO || $existing->status === 'topic_approved') {
                $message = 'Seu tema já foi aprovado pelo supervisor e está em análise no Nucleo Cientifico — não é possível submeter outro.';
            } elseif ($existing->status === Topic::STATUS_APPROVED_NUCLEO) {
                $message = 'Seu tema anterior já foi aprovado pelo Nucleo Cientifico — não é possível submeter outro.';
            } else {
                $message = 'Já existe um tema associado à sua conta que impede nova submissão.';
            }

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

        $similarTopics = $this->findSimilarApprovedTopics($data['title']);

        $topic = Topic::create([
            'student_id' => $user->id,
            'supervisor_id' => $studentProfile->supervisor->id,
            'scientific_area_id' => $data['scientific_area_id'],
            'course_id' => $data['course_id'],
            'title' => $data['title'],
            'justification' => $data['justification'] ?? null,
            'status' => Topic::STATUS_PENDING_SUPERVISOR,
            'supervisor_status' => Topic::SUPERVISOR_STATUS_PENDING,
            'submitted_at' => now(),
        ]);

        if ($document) {
            $path = $document->storeAs(
                'topics/' . $topic->id,
                'topic-document-' . $topic->id . '.docx',
                'public'
            );

            $topic->update([
                'document_path' => $path,
                'document_name' => $document->getClientOriginalName(),
            ]);
        }

        $topic->load([
            'scientificArea:id,name',
            'course:id,name,code',
            'supervisor.user:id,name,email',
        ]);

        event(new TopicStatusChanged($topic, null, $topic->status, $user));

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

    public function getMyApprovedTopics(User $user): array
    {
        $topics = Topic::query()
            ->where('student_id', $user->id)
            ->where('status', Topic::STATUS_APPROVED_NUCLEO)
            ->with(['scientificArea:id,name', 'course:id,name,code'])
            ->latest('submitted_at')
            ->get();

        $latestProtocols = Protocol::query()
            ->whereIn('topic_id', $topics->pluck('id'))
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->get()
            ->unique('topic_id')
            ->keyBy('topic_id');

        return $topics->map(function (Topic $topic) use ($latestProtocols) {
            $latestProtocol = $latestProtocols->get($topic->id);
            $canResubmitProtocol = $latestProtocol
                && in_array($latestProtocol->status, Protocol::resubmittableStatuses(), true);

            return [
                'id' => $topic->id,
                'title' => $topic->title,
                'justification' => $topic->justification,
                'status' => $topic->status,
                'status_label' => $topic->status_label,
                'submitted_at' => $topic->submitted_at,
                'has_protocol' => (bool) $latestProtocol && ! $canResubmitProtocol,
                'has_any_protocol' => (bool) $latestProtocol,
                'can_resubmit_protocol' => (bool) $canResubmitProtocol,
                'latest_protocol_id' => $latestProtocol?->id,
                'latest_protocol_status' => $latestProtocol?->status,
                'latest_protocol_status_label' => $latestProtocol?->status_label,
                'scientific_area' => $topic->scientificArea ? [
                    'id' => (int) $topic->scientificArea->id,
                    'name' => $topic->scientificArea->name,
                ] : null,
                'course' => $topic->course ? [
                    'id' => (int) $topic->course->id,
                    'name' => $topic->course->name,
                    'code' => $topic->course->code,
                ] : null,
            ];
        })->all();
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

    public function approveBySupervisor(Topic $topic, User $supervisor, ?string $comment = null): Topic
    {
        return DB::transaction(function () use ($topic, $supervisor, $comment) {
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
                'supervisor_comment'     => $comment,
                'supervisor_decision_at' => now(),
            ]);

            event(new TopicStatusChanged($topic, Topic::STATUS_PENDING_SUPERVISOR, Topic::STATUS_PENDING_NUCLEO, $supervisor));

            return $topic->load([
                'student:id,name,email',
                'supervisor.user:id,name,email',
                'scientificArea:id,name',
                'course:id,name,code',
            ]);
        });
    }

    public function rejectBySupervisor(Topic $topic, User $supervisor, ?string $comment = null): Topic
    {
        return DB::transaction(function () use ($topic, $supervisor, $comment) {
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
                'supervisor_comment' => $comment,
                'supervisor_decision_at' => now(),
            ]);

            event(new TopicStatusChanged($topic, Topic::STATUS_PENDING_SUPERVISOR, Topic::STATUS_REJECTED_SUPERVISOR, $supervisor));

            return $topic->load([
                'student:id,name,email',
                'supervisor.user:id,name,email',
                'scientificArea:id,name',
                'course:id,name,code',
            ]);
        });
    }

    /**
     * listForSecretary: Lista temas do núcleo da secretaria.
     *
     * Filtros:
     *   - scientific_area.organ_id === secretary.organ_id
     *   - status em fila de secretaria/revisão inicial
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
            ->whereHas('scientificArea', fn($q) => $q
                ->where('organ_id', $secretaryProfile->organ_id)
                ->when($secretaryProfile->scientific_area_id, fn($q) => $q->where('id', $secretaryProfile->scientific_area_id))
            )
            ->whereIn('status', [
                Topic::STATUS_PENDING_NUCLEO,
                Topic::STATUS_ASSIGNED,
                Topic::STATUS_IN_REVIEW,
            ])
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

        $pendingTopicReviews = $this->pendingTopicReviewsCountQuery();
        $pendingProtocolReviews = $this->pendingProtocolReviewsCountQuery();

        return $query
            ->when($assignedReviewerIds !== [], fn($q) => $q->whereNotIn('teacher_profiles.id', $assignedReviewerIds))
            ->leftJoinSub(
                $pendingTopicReviews,
                'pending_topic_reviews',
                fn($join) => $join
                    ->on('pending_topic_reviews.reviewer_id', '=', 'teacher_profiles.id')
            )
            ->leftJoinSub(
                $pendingProtocolReviews,
                'pending_protocol_reviews',
                fn($join) => $join
                    ->on('pending_protocol_reviews.reviewer_id', '=', 'teacher_profiles.id')
            )
            ->select(
                'teacher_profiles.id',
                'users.name',
                'users.email',
                'scientific_areas.name as scientific_area_name',
                DB::raw('COALESCE(pending_topic_reviews.pending_topic_reviews_count, 0) as pending_topic_reviews_count'),
                DB::raw('COALESCE(pending_protocol_reviews.pending_protocol_reviews_count, 0) as pending_protocol_reviews_count'),
                DB::raw('(COALESCE(pending_topic_reviews.pending_topic_reviews_count, 0) + COALESCE(pending_protocol_reviews.pending_protocol_reviews_count, 0)) as pending_reviews_count')
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

            Log::info('=== SUBMIT EVALUATION ===');

            Log::info('Dados do Topic recebido', [
                'id' => $topic->id,
                'status' => $topic->status,
                'title' => $topic->title ?? null,
                'student_id' => $topic->student_id ?? null,
                'supervisor_id' => $topic->supervisor_id ?? null,
                'scientific_area_id' => $topic->scientific_area_id ?? null,
                'created_at' => $topic->created_at,
                'updated_at' => $topic->updated_at,
            ]);


            Log::info('Estados permitidos para avaliação', [
                'STATUS_ASSIGNED' => Topic::STATUS_ASSIGNED,
                'STATUS_IN_REVIEW' => Topic::STATUS_IN_REVIEW,
                'current_status' => $topic->status,
                'can_evaluate' => in_array(
                    $topic->status,
                    [
                        Topic::STATUS_ASSIGNED,
                        Topic::STATUS_IN_REVIEW
                    ],
                    true
                )
            ]);


            Log::info('Dados enviados pelo avaliador', [
                'reviewer_id' => $reviewer->id,
                'reviewer_name' => $reviewer->name,
                'decision' => $data['decision'] ?? null,
                'comment_id' => $data['comment_id'] ?? null,
            ]);

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

            $oldStatus = $topic->status;
            $topic->update([
                'status' => $finalDecision ?: Topic::STATUS_IN_REVIEW,
            ]);

            if ($finalDecision) {
                event(new TopicStatusChanged($topic, $oldStatus, $finalDecision));
            }

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
     * getComments: Retorna comentários de um tema com filtros e paginação.
     *
     * @param Topic $topic
     * @param array $filters Filtros: status, search, order, per_page
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getComments(Topic $topic, array $filters = [])
    {
        $query = TopicReviewComment::query()
            ->where('topic_id', $topic->id)
            ->with([
                'user:id,name,email',
                'evaluations' => function ($query) {
                    $query->with('reviewer.user:id,name,email');
                },
            ]);

        // Filtro por status
        if (!empty($filters['status'])) {
            if ($filters['status'] === 'active') {
                $query->active();
            } elseif ($filters['status'] === 'inactive') {
                $query->where('status', TopicReviewComment::STATUS_INACTIVE);
            }
        }

        // Busca por termo no conteúdo
        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        // Ordenação
        $order = $filters['order'] ?? 'desc';
        $query->ordered($order);

        // Paginação (padrão 15 por página)
        $perPage = $filters['per_page'] ?? 15;

        return $query->paginate($perPage);
    }

    /**
     * Query base de docentes elegíveis para revisão de um tema.
     *
     * Restrições:
     *   - Mesma área científica e órgão (núcleo) do tema
     *   - Exclui o supervisor do tema
     */
    // private function eligibleReviewersQuery(Topic $topic): ?\Illuminate\Database\Query\Builder
    // {
    //     $topic->loadMissing('scientificArea:id,organ_id');

    //     $topicOrganId = $topic->scientificArea?->organ_id;

    //     if (! $topicOrganId || ! $topic->scientific_area_id) {
    //         return null;
    //     }

    //     return DB::table('teacher_profiles')
    //         ->distinct()
    //         ->join('scientific_areas', 'teacher_profiles.scientific_area_id', '=', 'scientific_areas.id')
    //         ->join('users', 'teacher_profiles.user_id', '=', 'users.id')
    //         ->join('organ_members', 'users.id', '=', 'organ_members.user_id')
    //         ->where('organ_members.organ_id', $topicOrganId)
    //         ->whereNull('organ_members.deleted_at')
    //         ->where('scientific_areas.organ_id', $topicOrganId)
    //         ->where('teacher_profiles.scientific_area_id', $topic->scientific_area_id)
    //         ->whereNull('teacher_profiles.deleted_at')
    //         ->whereNull('users.deleted_at')
    //         ->when($topic->supervisor_id, fn($q) => $q->where('teacher_profiles.id', '!=', $topic->supervisor_id));
    // }
private function eligibleReviewersQuery(Topic $topic): ?\Illuminate\Database\Query\Builder
{
    $topic->loadMissing('scientificArea.organ');

    $organ = $topic->scientificArea?->organ;

    if (! $organ) {
        return null;
    }

    // NÚCLEO CIENTÍFICO: elegibilidade por organ_id via scientific_areas
    if ($organ->isNucleus()) {
        return DB::table('teacher_profiles')
            ->join('users', 'teacher_profiles.user_id', '=', 'users.id')
            ->join('scientific_areas', 'teacher_profiles.scientific_area_id', '=', 'scientific_areas.id')
            ->where('scientific_areas.organ_id', $organ->id)
            ->whereNull('teacher_profiles.deleted_at')
            ->whereNull('users.deleted_at')
            ->when($topic->supervisor_id, fn($q) => $q->where('teacher_profiles.id', '!=', $topic->supervisor_id));
    }

    // // COMITÉ CIENTÍFICO / BIOÉTICA: elegibilidade por organ_id via organ_members
    // return DB::table('teacher_profiles')
    //     ->distinct()
    //     ->join('users', 'teacher_profiles.user_id', '=', 'users.id')
    //     ->join('organ_members', 'users.id', '=', 'organ_members.user_id')
    //     ->leftJoin('scientific_areas', 'teacher_profiles.scientific_area_id', '=', 'scientific_areas.id')
    //     ->where('organ_members.organ_id', $organ->id)
    //     ->whereNull('organ_members.deleted_at')
    //     ->whereNull('teacher_profiles.deleted_at')
    //     ->whereNull('users.deleted_at')
    //     ->when($topic->supervisor_id, fn($q) => $q->where('teacher_profiles.id', '!=', $topic->supervisor_id));
}


    private function pendingTopicReviewsCountQuery(): \Illuminate\Database\Query\Builder
    {
        return DB::table('topic_review_assignments')
            ->join('topics', 'topic_review_assignments.topic_id', '=', 'topics.id')
            ->leftJoin('topic_review_evaluations', function ($join) {
                $join->on('topic_review_evaluations.assignment_id', '=', 'topic_review_assignments.id')
                    ->whereNull('topic_review_evaluations.deleted_at');
            })
            ->whereNull('topic_review_assignments.deleted_at')
            ->whereNull('topics.deleted_at')
            ->whereIn('topics.status', [Topic::STATUS_ASSIGNED, Topic::STATUS_IN_REVIEW])
            ->where(function ($query) {
                $query->whereNull('topic_review_evaluations.id')
                    ->orWhereNull('topic_review_evaluations.decision');
            })
            ->select(
                'topic_review_assignments.reviewer_id',
                DB::raw('COUNT(*) as pending_topic_reviews_count')
            )
            ->groupBy('topic_review_assignments.reviewer_id');
    }

    private function pendingProtocolReviewsCountQuery(): \Illuminate\Database\Query\Builder
    {
        return DB::table('reviewer_evaluations')
            ->join('evaluation_forms', 'reviewer_evaluations.evaluation_form_id', '=', 'evaluation_forms.id')
            ->join('protocols', 'evaluation_forms.protocol_id', '=', 'protocols.id')
            ->whereNull('reviewer_evaluations.deleted_at')
            ->whereNull('evaluation_forms.deleted_at')
            ->whereNull('protocols.deleted_at')
            ->whereNull('reviewer_evaluations.submitted_at')
            ->where('reviewer_evaluations.status', '!=', ReviewerEvaluation::STATUS_SUBMITTED)
            ->where('evaluation_forms.status', '!=', EvaluationForm::STATUS_CONCLUDED)
            ->whereNotIn('protocols.status', [
                Protocol::STATUS_APPROVED_FINAL,
                Protocol::STATUS_REJECTED_FINAL,
            ])
            ->select(
                'reviewer_evaluations.reviewer_id',
                DB::raw('COUNT(*) as pending_protocol_reviews_count')
            )
            ->groupBy('reviewer_evaluations.reviewer_id');
    }

    public function viewComments(User $user, Topic $topic): bool
    {
        // Admin
        if ($user->hasPermission('admin.access')) {
            return true;
        }

        // Supervisor
        $teacher = $user->teacherProfile;

        if (
            $teacher &&
            $teacher->id === $topic->supervisor_id
        ) {
            return true;
        }

        // Avaliador
        if ($this->viewForReviewer($user, $topic)) {
            return true;
        }

        // Secretaria
        if ($this->viewForSecretary($user, $topic)) {
            return true;
        }

        return false;
    }
}
