<?php

namespace Modules\Protocol\app\Builders\Dashboard;

use Modules\Protocol\app\Contracts\DashboardBuilder;
use Modules\Protocol\app\Models\EvaluationForm;
use Modules\Protocol\app\Models\Protocol;
use Modules\User\app\Models\User;

class CoordinatorDashboardBuilder implements DashboardBuilder
{
    public function build(User $user): array
    {
        $coordinator = $user->coordinatorProfile;

        // Âmbito do coordenador: por curso e/ou por área científica.
        // CoordinatorProfile->scientific_area guarda o ID (nome de coluna
        // pouco óbvio, mas é o que está no model).
        $scopedProtocols = Protocol::query()
            ->when(
                $coordinator?->course_id,
                fn ($q) => $q->whereHas('topic', fn ($t) => $t->where('course_id', $coordinator->course_id))
            )
            ->when(
                $coordinator?->scientific_area,
                fn ($q) => $q->whereHas('topic', fn ($t) => $t->where('scientific_area_id', $coordinator->scientific_area))
            );

        $byStatus = (clone $scopedProtocols)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $pendingFinalDecisions = EvaluationForm::query()
            ->where('status', EvaluationForm::STATUS_DELIBERATED)
            ->whereHas('protocol', function ($q) use ($coordinator) {
                $q->when(
                    $coordinator?->course_id,
                    fn ($qq) => $qq->whereHas('topic', fn ($t) => $t->where('course_id', $coordinator->course_id))
                )->when(
                    $coordinator?->scientific_area,
                    fn ($qq) => $qq->whereHas('topic', fn ($t) => $t->where('scientific_area_id', $coordinator->scientific_area))
                );
            })
            ->with('protocol.topic')
            ->take(10)
            ->get()
            ->map(fn (EvaluationForm $f) => [
                'evaluation_form_id' => $f->id,
                'title'              => $f->protocol?->topic?->title,
                'organ'              => $f->organ,
            ])
            ->all();

        return [
            'profile' => [
                'name'  => $user->name,
                'email' => $user->email,
                'scope' => $coordinator?->course?->name ?? $coordinator?->scientificArea?->name,
            ],
            'stats' => [
                'total_protocols' => (clone $scopedProtocols)->count(),
                'by_status'       => $byStatus,
            ],
            'pending_final_decisions' => $pendingFinalDecisions,
            'notifications'           => [],
        ];
    }
}