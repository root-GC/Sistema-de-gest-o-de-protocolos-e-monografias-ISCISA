<?php

namespace Modules\Protocol\app\Builders\Dashboard;

use Modules\Protocol\app\Contracts\DashboardBuilder;
use Modules\Protocol\app\Models\Protocol;
use Modules\User\app\Models\User;

class SecretaryDashboardBuilder implements DashboardBuilder
{
    /**
     * Status "pending_X" = protocolo chegou ao órgão X e precisa que o
     * secretário atribua avaliadores. "in_review_X" já está atribuído
     * e não é trabalho do secretário — por isso fica fora da fila.
     */
    private const PENDING_ASSIGNMENT_STATUSES = [
        Protocol::STATUS_PENDING_NUCLEO,
        Protocol::STATUS_PENDING_COMITE_CIENTIFICO,
        Protocol::STATUS_PENDING_COMITE_BIOETICA,
    ];

    public function build(User $user): array
    {
        // Ajusta: como é que sabes a que órgão este secretário pertence?
        // Ex.: $user->secretaryProfile?->organ_id
        $organId = $user->secretaryProfile?->organ_id ?? null;

        $query = Protocol::query()
            ->whereIn('status', self::PENDING_ASSIGNMENT_STATUSES)
            ->when($organId, fn ($q) => $q->where('current_organ_id', $organId))
            ->with('topic');

        $pendingByStatus = (clone $query)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $items = $query->latest('submitted_at')
            ->take(10)
            ->get()
            ->map(fn (Protocol $p) => [
                'protocol_id'   => $p->id,
                'title'         => $p->topic?->title,
                'waiting_since' => $p->submitted_at,
                'action_needed' => $p->status_label,
            ])
            ->all();

        return [
            'queue' => [
                'pending_nucleo'           => (int) ($pendingByStatus[Protocol::STATUS_PENDING_NUCLEO] ?? 0),
                'pending_comite_cientifico' => (int) ($pendingByStatus[Protocol::STATUS_PENDING_COMITE_CIENTIFICO] ?? 0),
                'pending_comite_bioetica'   => (int) ($pendingByStatus[Protocol::STATUS_PENDING_COMITE_BIOETICA] ?? 0),
                'items'                    => $items,
            ],
            'notifications' => $this->notifications($user),
        ];
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