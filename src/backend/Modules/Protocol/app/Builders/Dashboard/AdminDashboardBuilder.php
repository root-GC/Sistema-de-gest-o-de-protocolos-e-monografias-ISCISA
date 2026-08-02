<?php

namespace Modules\Protocol\app\Builders\Dashboard;

use Modules\Protocol\app\Contracts\DashboardBuilder;
use Modules\Protocol\app\Models\Protocol;
use Modules\User\app\Models\User;

class AdminDashboardBuilder implements DashboardBuilder
{
    public function build(User $user): array
    {
        $admin = $user->adminProfile;
        $isGlobal = $admin?->access_scope === 'global';

        $scopedProtocols = Protocol::query()
            ->when(!$isGlobal && $admin?->organ_id, fn ($q) => $q->where('current_organ_id', $admin->organ_id));

        $byStatus = (clone $scopedProtocols)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return [
            'profile' => [
                'name'  => $user->name,
                'email' => $user->email,
                'scope' => $isGlobal ? 'Global' : $admin?->organ?->name,
            ],
            'stats' => [
                // total_users só faz sentido para o admin com acesso global
                'total_users'          => $isGlobal ? User::count() : null,
                'total_protocols'      => (clone $scopedProtocols)->count(),
                'by_status'            => $byStatus,
                'protocols_this_month' => (clone $scopedProtocols)
                    ->whereMonth('submitted_at', now()->month)
                    ->whereYear('submitted_at', now()->year)
                    ->count(),
            ],
            'notifications' => [],
        ];
    }
}