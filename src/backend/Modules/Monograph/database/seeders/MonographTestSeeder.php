<?php

namespace Modules\Monograph\database\seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class MonographTestSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $studentId         = DB::table('users')->where('email', 'estudante@iscisa.ac.mz')->value('id');
        $supervisorUserId  = DB::table('users')->where('email', 'docente@iscisa.ac.mz')->value('id');
        $secretaryUserId   = DB::table('users')->where('email', 'secretario@iscisa.ac.mz')->value('id');
        $coordinatorUserId = DB::table('users')->where('email', 'coord@iscisa.ac.mz')->value('id');

        if (!$studentId || !$supervisorUserId || !$secretaryUserId || !$coordinatorUserId) {
            $this->command->error('Execute primeiro o TestUserSeeder (Auth).');
            return;
        }

        // Ensure student profile exists
        $studentProfile = DB::table('student_profiles')->where('user_id', $studentId)->first();
        if (!$studentProfile) {
            $this->command->error('Estudante não possui student_profile. Execute OrganizationDatabaseSeeder.');
            return;
        }

        $courseId = $studentProfile->course_id;
        $course = DB::table('courses')->where('id', $courseId)->first();
        if (!$course) {
            $this->command->error('Curso do estudante não encontrado.');
            return;
        }

        $areaId = $course->scientific_area_id;

        // Align coordinator profile to student's area/course for policy checks
        $coordinatorProfile = DB::table('coordinator_profiles')->where('user_id', $coordinatorUserId)->first();
        if (!$coordinatorProfile) {
            $this->command->error('Coordenador não possui coordinator_profile. Execute OrganizationDatabaseSeeder.');
            return;
        }

        DB::table('coordinator_profiles')->where('user_id', $coordinatorUserId)->update([
            'scientific_area_id' => $areaId,
            'course_id'          => $courseId,
            'updated_at'         => $now,
        ]);

        $organId = DB::table('organs')->value('id');
        if (!$organId) {
            $this->command->error('Execute OrganizationDatabaseSeeder primeiro.');
            return;
        }

        // Grant minimal permissions for test roles
        $this->grantPermission('monograph.endorse', ['supervisor']);
        $this->grantPermission('monograph.comment', ['supervisor', 'secretary', 'coordinator']);

        // Ensure supervisor has a teacher_profile
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

        // Ensure secretary profile exists
        $secretaryColumns = Schema::getColumnListing('secretary_profiles');
        $secretaryPayload = array_filter([
            'organ_id' => in_array('organ_id', $secretaryColumns) ? $organId : null,
            'office'   => in_array('office', $secretaryColumns) ? 'Secretaria Geral' : null,
        ], fn ($v) => !is_null($v));
        $secretaryPayload['created_at'] = $now;
        $secretaryPayload['updated_at'] = $now;
        DB::table('secretary_profiles')->updateOrInsert(['user_id' => $secretaryUserId], $secretaryPayload);

        // Create a simple topic and protocol to attach the monograph
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

        $monographId = DB::table('monographs')->insertGetId([
            'protocol_id'   => $protocolId,
            'student_id'    => $studentId,
            'supervisor_id' => $teacherProfileId,
            'code'          => 'ISCISA-M001-' . now()->year,
            'title'         => 'Monografia de Teste',
            'status'        => 'aguarda_submissao',
            'created_at'    => $now,
            'updated_at'    => $now,
        ]);

        $this->command->info("Monograph seeded: ID={$monographId} code=ISCISA-M001-" . now()->year);
    }

    private function grantPermission(string $permissionCode, array $roleNames): void
    {
        $permId = DB::table('permissions')->where('code', $permissionCode)->value('id');
        if (!$permId) {
            $permId = DB::table('permissions')->insertGetId([
                'code'        => $permissionCode,
                'description' => $permissionCode,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
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
