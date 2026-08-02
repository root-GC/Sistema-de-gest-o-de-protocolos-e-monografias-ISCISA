<?php

namespace Modules\Protocol\app\Builders\Dashboard;

use Modules\Protocol\app\Contracts\DashboardBuilder;

class DashboardBuilderFactory
{
    /**
     * Mapa role => builder. Adiciona uma linha aqui de cada vez que migrares
     * mais um role para o novo formato (supervisor, coordinator, admin...).
     *
     * @var array<string, class-string<DashboardBuilder>>
     */
    private array $map = [
        'student'     => StudentDashboardBuilder::class,
        'secretary'   => SecretaryDashboardBuilder::class,
        'reviewer'    => ReviewerDashboardBuilder::class,
        'supervisor'  => SupervisorDashboardBuilder::class,
        'coordinator' => CoordinatorDashboardBuilder::class,
        'admin'       => AdminDashboardBuilder::class,
    ];

    public function for(?string $role): DashboardBuilder
{
    if (!isset($this->map[$role])) {
        throw new \InvalidArgumentException("Sem dashboard configurado para o role \"{$role}\".");
    }

    return app($this->map[$role]);
}
}