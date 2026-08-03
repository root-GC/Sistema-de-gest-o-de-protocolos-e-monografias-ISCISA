<?php

namespace Modules\Monograph\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\{DB, Schema};
use Illuminate\Support\Str;

class MonographTestSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $studentId        = DB::table('users')->where('email', 'estudante@iscisa.ac.mz')->value('id');
        $supervisorUserId = DB::table('users')->where('email', 'docente@iscisa.ac.mz')->value('id');
        $secretaryUserId  = DB::table('users')->where('email', 'secretario@iscisa.ac.mz')->value('id');
        $coordinatorUserId = DB::table('users')->where('email', 'coord@iscisa.ac.mz')->value('id');

        if (!$studentId || !$supervisorUserId || !$secretaryUserId || !$coordinatorUserId) {
            $this->command->error(
                'Corre primeiro o TestUserSeeder (Auth).'
            );
            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Usa o curso e área do coordenador
        |--------------------------------------------------------------------------
        |
        | A DefensePolicy valida:
        | coordinatorProfile.course_id == topic.course_id
        | OU
        | coordinatorProfile.scientific_area_id == topic.scientific_area_id
        |
        | Portanto o cenário de teste deve respeitar essa regra.
        |
        */

        $coordinatorProfile = DB::table('coordinator_profiles')
            ->where('user_id', $coordinatorUserId)
            ->first();

        if (!$coordinatorProfile) {
            $this->command->error(
                'Coordenador não possui CoordinatorProfile.'
            );
            return;
        }

        $areaId   = $coordinatorProfile->scientific_area_id;
        $courseId = $coordinatorProfile->course_id;


        $organId = DB::table('organs')->value('id');

        if (!$organId) {
            $this->command->error(
                'Corre primeiro o OrganizationDatabaseSeeder.'
            );
            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Permissões
        |--------------------------------------------------------------------------
        */

        $this->grantPermission(
            'monograph.endorse',
            ['supervisor']
        );

        $this->grantPermission(
            'monograph.comment',
            [
                'supervisor',
                'secretary',
                'coordinator'
            ]
        );


        /*
        |--------------------------------------------------------------------------
        | Perfil do supervisor
        |--------------------------------------------------------------------------
        */

        DB::table('teacher_profiles')->updateOrInsert(
            [
                'user_id' => $supervisorUserId
            ],
            [
                'scientific_area_id' => $areaId,
                'department'         => 'Depto Teste',
                'academic_degree'    => 'doutoramento',
                'is_internal'        => true,
                'created_at'         => $now,
                'updated_at'         => $now,
            ]
        );


        $teacherProfileId = DB::table('teacher_profiles')
            ->where('user_id', $supervisorUserId)
            ->value('id');


        /*
        |--------------------------------------------------------------------------
        | Perfil da secretaria
        |--------------------------------------------------------------------------
        */

        $secretaryColumns = Schema::getColumnListing(
            'secretary_profiles'
        );

        $secretaryPayload = array_filter([
            'organ_id' => in_array('organ_id', $secretaryColumns)
                ? $organId
                : null,

            'office' => in_array('office', $secretaryColumns)
                ? 'Secretaria Geral'
                : null,

        ], fn ($v) => !is_null($v));


        $secretaryPayload['created_at'] = $now;
        $secretaryPayload['updated_at'] = $now;


        DB::table('secretary_profiles')->updateOrInsert(
            [
                'user_id' => $secretaryUserId
            ],
            $secretaryPayload
        );


        /*
        |--------------------------------------------------------------------------
        | Topic
        |--------------------------------------------------------------------------
        */

        $topicId = DB::table('topics')->insertGetId([
            'student_id'             => $studentId,

            // Agora coincide com o coordenador
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


        /*
        |--------------------------------------------------------------------------
        | Protocol
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | Monografia
        |--------------------------------------------------------------------------
        */

        $monographId = DB::table('monographs')->insertGetId([
            'protocol_id'   => $protocolId,

            'student_id'    => $studentId,

            'supervisor_id' => $teacherProfileId,

            'title'         => 'Monografia de Teste',

            'status'        => 'aguarda_submissao',

            'created_at'    => $now,
            'updated_at'    => $now,
        ]);


        $this->command->info("Topic ID: {$topicId}");
        $this->command->info("Protocol ID: {$protocolId}");
        $this->command->info("Monograph ID: {$monographId}");

        $this->command->info(
            "Área usada: {$areaId}"
        );

        $this->command->info(
            "Curso usado: {$courseId}"
        );

        $this->command->info(
            'Coordenadora: coord@iscisa.ac.mz / password123'
        );
    }



    private function grantPermission(
        string $permissionCode,
        array $roleNames
    ): void {

        $permId = DB::table('permissions')
            ->where('code', $permissionCode)
            ->value('id');


        if (!$permId) {

            $permId = DB::table('permissions')->insertGetId([
                'code'        => $permissionCode,
                'description' => $permissionCode,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }


        foreach ($roleNames as $roleName) {

            $roleId = DB::table('roles')
                ->where('name', $roleName)
                ->value('id');


            if ($roleId) {

                DB::table('role_permissions')
                    ->updateOrInsert(
                        [
                            'role_id'       => $roleId,
                            'permission_id' => $permId,
                        ],
                        [
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]
                    );
            }
        }
    }
}