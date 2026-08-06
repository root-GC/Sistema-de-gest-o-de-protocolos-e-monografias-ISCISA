<?php

namespace Modules\Protocol\app\Contracts;

use Modules\User\app\Models\User;

/**
 * Cada role tem o seu próprio builder, que devolve um payload com FORMA FIXA
 * (não uma lista de widgets genéricos filtrados por permissão).
 *
 * Isto obriga a pensar "o que é que este utilizador precisa de ver",
 * em vez de "que permissões dão acesso a que caixinhas".
 */
interface DashboardBuilder
{
    public function build(User $user): array;
}