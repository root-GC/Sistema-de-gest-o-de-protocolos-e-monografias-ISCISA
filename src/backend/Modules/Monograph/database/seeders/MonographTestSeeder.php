<?php

namespace Modules\Monograph\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\{DB, Schema};
use Illuminate\Support\Str;

/**
 * Simula um protocolo aprovado + monografia inicial, para testar
 * o módulo Monograph sem depender do módulo Protocol estar completo.
 * Requer que TestUserSeeder (Auth) e OrganizationDatabaseSeeder já tenham corrido.
 */
class MonographTestSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $studentId        = DB::table('users')->where('email', 'estudante@iscisa.ac.mz')->value('id');
        $supervisorUserId = DB::table('users')->where('email', 'docente@iscisa.ac.mz')->value('id');
        $secretaryUserId  = DB::table('users')->where('email', 'secretario@iscisa.ac.mz')->value('id');

        if (!$studentId || !$supervisorUserId || !$secretaryUserId) {
            $this->command->error('Corre primeiro o TestUserSeeder (módulo Auth).');
            return;
        }

        $areaId   = DB::table('scientific_areas')->value('id');
        $courseId = DB::table('courses')->value('id');
        $organId  = DB::table('organs')->value('id');

        if (!$areaId || !$courseId || !$organId) {
            $this->command->error('Corre primeiro o OrganizationDatabaseSeeder.');
            return;
        }

        // ── permissões: monograph.endorse (supervisor) e monograph.comment
        // (supervisor, secretary, coordinator) — a migration só cria a
        // permissão, a associação à role só pode acontecer aqui porque
        // 'roles' só está populada depois do RoleSeeder.
        $this->grantPermission('monograph.endorse', ['supervisor']);
        $this->grantPermission('monograph.comment', ['supervisor', 'secretary', 'coordinator']);

        // ── teacher_profile do supervisor (colunas confirmadas: is_internal)
        DB::table('teacher_profiles')->updateOrInsert(
            ['user_id' => $supervisorUserId],
            [
                'scientific_area_id' => $areaId,
                'department'         => 'Depto Teste',
                'academic_degree'    => 'doutoramento',
                'is_internal'        => true,
                'created_at'         => $now,
                'updated_at'         => $now,
            ]
        );

        $teacherProfileId = DB::table('teacher_profiles')->where('user_id', $supervisorUserId)->value('id');

        // ── secretary_profile
        $secretaryColumns = Schema::getColumnListing('secretary_profiles');
        $secretaryPayload = array_filter([
            'organ_id' => in_array('organ_id', $secretaryColumns) ? $organId : null,
            'office'   => in_array('office', $secretaryColumns) ? 'Secretaria Geral' : null,
        ], fn ($v) => !is_null($v));

        $secretaryPayload['created_at'] = $now;
        $secretaryPayload['updated_at'] = $now;

        DB::table('secretary_profiles')->updateOrInsert(
            ['user_id' => $secretaryUserId],
            $secretaryPayload
        );

        // ── topic (aprovado — simula fluxo já concluído)
        $topicId = DB::table('topics')->insertGetId([
            'student_id'             => $studentId,
            'scientific_area_id'     => $areaId,
            'course_id'              => $courseId,
            'title'                  => 'Tema de Teste',
            'status'                 => 'topic_approved',
            'supervisor_id'          => $teacherProfileId,
            'supervisor_status'      => 'approved',
            'supervisor_decision_at' => $now,
            'submitted_at'           => $now,
            'created_at'             => $now,
            'updated_at'             => $now,
        ]);

        // ── protocol (aprovado para campo)
        $protocolId = DB::table('protocols')->insertGetId([
            'student'                => $studentId,
            'current_organ_id'       => $organId,
            'code'                   => 'PROT-' . Str::upper(Str::random(6)),
            'topic_id'               => $topicId,
            'approved_by_supervisor' => true,
            'protocol_type'          => 'cientifico',
            'submission_number'      => '2026-001',
            'status'                 => 'aprovado_para_campo',
            'version'                => '1',
            'submitted_at'           => $now,
            'supervisor_decision_at' => $now,
            'created_at'             => $now,
            'updated_at'             => $now,
        ]);

        // ── monografia — o que o futuro listener OnProtocolApproved criaria
        $monographId = DB::table('monographs')->insertGetId([
            'protocol_id'   => $protocolId,
            'student_id'    => $studentId,
            'supervisor_id' => $teacherProfileId,
            'title'         => 'Monografia de Teste',
            'status'        => 'aguarda_submissao',
            'created_at'    => $now,
            'updated_at'    => $now,
        ]);

        $this->command->info("Protocol ID: {$protocolId}");
        $this->command->info("Monograph ID: {$monographId}");
        $this->command->info('Estudante: estudante@iscisa.ac.mz / password123');
        $this->command->info('Supervisor: docente@iscisa.ac.mz / password123');
        $this->command->info('Secretário: secretario@iscisa.ac.mz / password123');
    }

    private function grantPermission(string $code, array $roleNames): void
    {
        $permId = DB::table('permissions')->where('code', $code)->value('id');

        if (!$permId) {
            return;
        }

        foreach ($roleNames as $roleName) {
            $roleId = DB::table('roles')->where('name', $roleName)->value('id');

            if ($roleId) {
                DB::table('role_permissions')->updateOrInsert(
                    ['role_id' => $roleId, 'permission_id' => $permId],
                    ['created_at' => now(), 'updated_at' => now()]
                );
            }
        }
    }
}