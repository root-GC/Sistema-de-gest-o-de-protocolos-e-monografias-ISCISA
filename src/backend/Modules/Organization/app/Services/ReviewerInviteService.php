<?php

namespace Modules\Organization\app\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Organization\app\Models\Organ;
use Modules\Organization\app\Models\OrganMember;
use Modules\User\app\Models\User;
use Modules\User\app\Models\Role;

class ReviewerInviteService
{
    public function __construct(
        private \Modules\Auth\app\Services\BrevoMailerService $mailer,
    ) {}

    /**
     * Convidar docente como revisor
     * Se o email falhar, faz rollback de tudo
     */
    public function invite(User $teacher, Organ $organ): OrganMember
    {
        return DB::transaction(function () use ($teacher, $organ) {
            // Usar updateOrCreate para evitar duplicados
            $member = OrganMember::withTrashed()->updateOrCreate(
                [
                    'organ_id' => $organ->id,
                    'user_id'  => $teacher->id,
                ],
                [
                    'role'       => 'reviewer',
                    'deleted_at' => null,
                ]
            );

            // Atribuir role "reviewer" ao utilizador
            $reviewerRole = Role::firstOrCreate(['name' => 'reviewer']);
            $roleAttached = false;
            
            if (!$teacher->hasRole('reviewer')) {
                $teacher->roles()->attach($reviewerRole->id);
                $roleAttached = true;
            }

            // Enviar email de notificação
            try {
                $loginUrl = rtrim(config('app.frontend_url'), '/') . '/login';
                
                $this->mailer->send(
                    ['email' => $teacher->email, 'name' => $teacher->name],
                    "Convite: Revisor no {$organ->name} — SGPMC-ISCISA",
                    view('auth::emails.reviewer-invitation', [
                        'teacherName' => $teacher->name,
                        'organName'   => $organ->name,
                        'role'        => 'Revisor',
                        'loginUrl'    => $loginUrl,
                    ])->render()
                );

                Log::info('[ReviewerInviteService] Email de convite enviado', [
                    'teacher_email' => $teacher->email,
                    'organ_name'    => $organ->name,
                ]);
            } catch (\Throwable $e) {
                Log::error('[ReviewerInviteService] Falha ao enviar email de convite', [
                    'email' => $teacher->email,
                    'error' => $e->getMessage(),
                ]);
                
                // Rollback manual dentro da transaction
                // Remover o membro se foi criado agora
                if ($member->wasRecentlyCreated) {
                    $member->forceDelete();
                } else {
                    // Se foi restaurado, volta a apagar
                    $member->delete();
                }
                
                // Remover a role se foi adicionada agora
                if ($roleAttached) {
                    $teacher->roles()->detach($reviewerRole->id);
                }
                
                throw new \RuntimeException('Não foi possível enviar o email de convite. Detalhe: ' . $e->getMessage());
            }

            return $member->fresh()->load('user');
        });
    }

    /**
     * Notificar mudança de role (apenas informativo, sem rollback)
     */
    public function notifyRoleChange(User $teacher, Organ $organ, string $newRole): void
    {
        try {
            $loginUrl = rtrim(config('app.frontend_url'), '/') . '/login';
            $roleLabel = match($newRole) {
                'reviewer' => 'Revisor',
                'coordinator' => 'Coordenador',
                'member' => 'Membro',
                default => $newRole,
            };
            
            $this->mailer->send(
                ['email' => $teacher->email, 'name' => $teacher->name],
                "Atualização de Função: {$roleLabel} no {$organ->name} — SGPMC-ISCISA",
                view('auth::emails.reviewer-role-updated', [
                    'teacherName' => $teacher->name,
                    'organName'   => $organ->name,
                    'role'        => $roleLabel,
                    'loginUrl'    => $loginUrl,
                ])->render()
            );

            Log::info('[ReviewerInviteService] Email de atualização enviado', [
                'teacher_email' => $teacher->email,
                'new_role'      => $newRole,
            ]);
        } catch (\Throwable $e) {
            Log::error('[ReviewerInviteService] Falha ao enviar email de atualização', [
                'email' => $teacher->email,
                'error' => $e->getMessage(),
            ]);
            // Não lança exceção - email é apenas informativo
        }
    }

    /**
     * Notificar remoção do órgão (apenas informativo, sem rollback)
     */
    public function notifyRemoval(User $teacher, Organ $organ): void
    {
        try {
            $loginUrl = rtrim(config('app.frontend_url'), '/') . '/login';
            
            $this->mailer->send(
                ['email' => $teacher->email, 'name' => $teacher->name],
                "Remoção do {$organ->name} — SGPMC-ISCISA",
                view('auth::emails.reviewer-removed', [
                    'teacherName' => $teacher->name,
                    'organName'   => $organ->name,
                    'loginUrl'    => $loginUrl,
                ])->render()
            );

            Log::info('[ReviewerInviteService] Email de remoção enviado', [
                'teacher_email' => $teacher->email,
                'organ_name'    => $organ->name,
            ]);
        } catch (\Throwable $e) {
            Log::error('[ReviewerInviteService] Falha ao enviar email de remoção', [
                'email' => $teacher->email,
                'error' => $e->getMessage(),
            ]);
            // Não lança exceção - email é apenas informativo
        }
    }

    /**
     * Remover membro do órgão e opcionalmente remover a role de reviewer
     */
    public function removeMember(OrganMember $member, bool $removeRole = true): void
    {
        DB::transaction(function () use ($member, $removeRole) {
            $user = $member->user;
            $organ = $member->organ;
            
            // Soft delete do membro
            $member->delete();

            // Remover a role "reviewer" se solicitado
            if ($removeRole) {
                $reviewerRole = Role::where('name', 'reviewer')->first();
                if ($reviewerRole && $user->hasRole('reviewer')) {
                    // Só remove a role "reviewer" se o utilizador não for reviewer em nenhum outro órgão
                    $otherReviewerMemberships = OrganMember::where('user_id', $user->id)
                        ->where('id', '!=', $member->id)
                        ->where('role', 'reviewer')
                        ->whereNull('deleted_at')
                        ->exists();

                    if (!$otherReviewerMemberships) {
                        $user->roles()->detach($reviewerRole->id);
                        
                        Log::info('[ReviewerInviteService] Role reviewer removida', [
                            'user_id' => $user->id,
                        ]);
                    }
                }
            }

            // Enviar email de notificação (informativo)
            $this->notifyRemoval($user, $organ);

            Log::info('[ReviewerInviteService] Membro removido', [
                'user_id'  => $user->id,
                'organ_id' => $organ->id,
                'role'     => $member->role,
            ]);
        });
    }

    /**
     * Remover completamente o membro (force delete) e a role
     */
    public function forceRemoveMember(OrganMember $member): void
    {
        DB::transaction(function () use ($member) {
            $user = $member->user;
            $organ = $member->organ;
            
            // Force delete do membro
            $member->forceDelete();

            // Remover a role "reviewer" se não for reviewer em nenhum outro órgão
            $reviewerRole = Role::where('name', 'reviewer')->first();
            if ($reviewerRole && $user->hasRole('reviewer')) {
                $otherReviewerMemberships = OrganMember::where('user_id', $user->id)
                    ->where('role', 'reviewer')
                    ->whereNull('deleted_at')
                    ->exists();

                if (!$otherReviewerMemberships) {
                    $user->roles()->detach($reviewerRole->id);
                }
            }

            Log::info('[ReviewerInviteService] Membro removido permanentemente', [
                'user_id'  => $user->id,
                'organ_id' => $organ->id,
            ]);
        });
    }
}