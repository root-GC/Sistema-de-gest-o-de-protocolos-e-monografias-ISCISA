<?php

namespace Modules\Protocol\app\Builders\Dashboard;

use Modules\Protocol\app\Contracts\DashboardBuilder;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\Topic;
use Modules\User\app\Models\User;

class SecretaryDashboardBuilder implements DashboardBuilder
{
    /**
     * Status "pending_X" = protocolo chegou ao órgão X e precisa que o
     * secretário atribua avaliadores. "in_review_X" já está atribuído
     * e não é trabalho do secretário — por isso fica fora da fila.
     */
    private const PENDING_ASSIGNMENT_STATUSES = [
        Protocol::STATUS_PENDING_COMITE_CIENTIFICO,
        Protocol::STATUS_PENDING_COMITE_BIOETICA,
    ];

    public function build(User $user): array
    {
        $secretaryProfile = $user->secretaryProfile;
        $organ = $secretaryProfile?->organ;

        if (! $organ) {
            return [
                'queue' => [
                    'pending_topics' => 0,
                    'pending_nucleo' => 0,
                    'pending_comite_cientifico' => 0,
                    'pending_comite_bioetica' => 0,
                    'items' => [],
                ],
                'notifications' => $this->notifications($user),
            ];
        }

        if ($organ->type === 'nucleus') {
            $topics = Topic::query()
                ->where('status', Topic::STATUS_PENDING_NUCLEO)
                ->whereHas('scientificArea', fn ($query) => $query->where('organ_id', $organ->id))
                ->when(
                    $secretaryProfile->scientific_area_id,
                    fn ($query) => $query->where('scientific_area_id', $secretaryProfile->scientific_area_id)
                );

            $items = $topics->with(['course:id,name,code', 'scientificArea:id,name'])
                ->latest('submitted_at')
                ->take(10)
                ->get()
                ->map(fn (Topic $topic) => [
                    'topic_id' => $topic->id,
                    'item_type' => 'topic',
                    'title' => $topic->title,
                    'waiting_since' => $topic->submitted_at,
                    'action_needed' => $topic->status_label,
                ])
                ->all();

            $pendingTopics = (clone $topics)->count();

            return [
                'queue' => [
                    'pending_topics' => $pendingTopics,
                    'pending_nucleo' => 0,
                    'pending_comite_cientifico' => 0,
                    'pending_comite_bioetica' => 0,
                    'items' => $items,
                ],
                'notifications' => $this->notifications($user),
            ];
        }

        $query = Protocol::query()
            ->whereIn('status', self::PENDING_ASSIGNMENT_STATUSES)
            ->where('current_organ_id', $organ->id)
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
                'item_type'     => 'protocol',
                'title'         => $p->topic?->title,
                'waiting_since' => $p->submitted_at,
                'action_needed' => $p->status_label,
            ])
            ->all();

        return [
            'queue' => [
                'pending_topics'            => 0,
                'pending_nucleo'           => 0,
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
