<?php

namespace Modules\Protocol\app\Builders\Dashboard;

use Modules\Protocol\app\Contracts\DashboardBuilder;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\Topic;
use Modules\User\app\Models\User;

class StudentDashboardBuilder implements DashboardBuilder
{
    /**
     * Sequência feliz do Protocol através dos 3 órgãos.
     * Não inclui os estados "rejected_*" — esses são tratados à parte,
     * como um desvio da linha, não como um passo dela.
     */
    private const PROTOCOL_FLOW = [
        Protocol::STATUS_PENDING_SUPERVISOR       => 'Aguardando aprovação do supervisor',
        Protocol::STATUS_PENDING_NUCLEO           => 'Encaminhado ao Núcleo Científico',
        Protocol::STATUS_IN_REVIEW_NUCLEO         => 'Em avaliação — Núcleo Científico',
        Protocol::STATUS_PENDING_COMITE_CIENTIFICO    => 'Encaminhado ao Comité Científico',
        Protocol::STATUS_IN_REVIEW_COMITE_CIENTIFICO  => 'Em avaliação — Comité Científico',
        Protocol::STATUS_DOCUMENTS_PENDING_CIBS        => 'Validação documental — Comité de Bioética',
        Protocol::STATUS_PENDING_COMITE_BIOETICA      => 'Encaminhado ao Comité de Bioética',
        Protocol::STATUS_IN_REVIEW_COMITE_BIOETICA    => 'Em avaliação — Comité de Bioética',
        Protocol::STATUS_APPROVED_FINAL           => 'Aprovado',
    ];

    private const REJECTED_STATUSES = [
        Protocol::STATUS_REJECTED_SUPERVISOR,
        Protocol::STATUS_REJECTED_NUCLEO,
        Protocol::STATUS_REJECTED_CC,
        Protocol::STATUS_REJECTED_BIOETICA,
        Protocol::STATUS_REJECTED_FINAL,
    ];

    public function build(User $user): array
    {
        $protocol = Protocol::query()
            ->where('student', $user->id)
            ->with('topic')
            ->latest()
            ->first();

        $topic = $protocol?->topic ?? Topic::query()
            ->where('student_id', $user->id)
            ->latest()
            ->first();

        return [
            'profile'       => $this->profile($user, $protocol),
            'phase'         => $protocol ? 'protocol' : ($topic ? 'topic' : 'none'),
            'topic'         => $topic ? $this->topicPayload($topic) : null,
            'protocol'      => $protocol ? $this->protocolPayload($protocol) : null,
            'notifications' => $this->notifications($user),
        ];
    }

    private function profile(User $user, ?Protocol $protocol): array
    {
        return [
            'name'       => $user->name,
            'email'      => $user->email,
            // TeacherProfile provavelmente tem uma relação para o User com o nome — ajusta.
            'supervisor' => $protocol?->supervisor?->user?->name
                ?? $protocol?->topic?->supervisor?->user?->name,
        ];
    }

    private function topicPayload(Topic $topic): array
    {
        return [
            'id'           => $topic->id,
            'title'        => $topic->title,
            'status'       => $topic->status,
            'status_label' => $topic->status_label,
            'rejected'     => in_array($topic->status, Topic::rejectedStatuses(), true),
        ];
    }

    private function protocolPayload(Protocol $protocol): array
    {
        $isRejected = in_array($protocol->status, self::REJECTED_STATUSES, true);

        return [
            'id'            => $protocol->id,
            'code'          => $protocol->code,
            'title'         => $protocol->topic?->title,
            'current_stage' => $protocol->status,
            'stage_label'   => $protocol->status_label,
            'is_rejected'   => $isRejected,
            'next_action'   => $isRejected ? null : $this->nextAction($protocol->status),
            'timeline'      => $isRejected ? [] : $this->timeline($protocol->status),
        ];
    }

    private function nextAction(string $status): ?string
    {
        return match ($status) {
            Protocol::STATUS_PENDING_SUPERVISOR      => 'Aguardando aprovação do teu supervisor.',
            Protocol::STATUS_PENDING_NUCLEO,
            Protocol::STATUS_PENDING_COMITE_CIENTIFICO,
            Protocol::STATUS_PENDING_COMITE_BIOETICA => 'Aguardando atribuição de avaliadores.',
            Protocol::STATUS_IN_REVIEW_NUCLEO,
            Protocol::STATUS_IN_REVIEW_COMITE_CIENTIFICO,
            Protocol::STATUS_IN_REVIEW_COMITE_BIOETICA => 'Aguardando parecer dos avaliadores.',
            default => null,
        };
    }

    private function timeline(string $currentStatus): array
    {
        $stages = array_keys(self::PROTOCOL_FLOW);
        $currentIndex = array_search($currentStatus, $stages, true);
        $currentIndex = $currentIndex === false ? 0 : $currentIndex;

        $result = [];
        $i = 0;
        foreach (self::PROTOCOL_FLOW as $status => $label) {
            $result[] = [
                'stage'   => $status,
                'label'   => $label,
                'done'    => $i < $currentIndex,
                'current' => $i === $currentIndex,
            ];
            $i++;
        }

        return $result;
    }

    private function notifications(User $user): array
    {
        if (!method_exists($user, 'notifications')) {
            return [];
        }

        return $user->notifications()
            ->latest()
            ->take(10)
            ->get(['id', 'data', 'read_at', 'created_at'])
            ->map(fn ($n) => [
                'id'         => $n->id,
                'message'    => $n->data['message'] ?? '',
                'read'       => $n->read_at !== null,
                'created_at' => $n->created_at,
            ])
            ->all();
    }
}