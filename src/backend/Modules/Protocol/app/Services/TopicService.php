<?php

namespace Modules\Protocol\app\Services;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Protocol\app\Models\Topic;
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
}
