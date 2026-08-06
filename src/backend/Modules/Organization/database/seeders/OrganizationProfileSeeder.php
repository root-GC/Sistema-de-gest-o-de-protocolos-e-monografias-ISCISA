<?php

namespace Modules\Organization\database\seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Liga os utilizadores de teste (criados em Auth\TestUserSeeder)
 * à estrutura organizacional.
 *
 * Depende de:
 *   - Auth\TestUserSeeder       (users existem)
 *   - OrganSeeder               (organs existem)
 *   - ScientificAreaAndCourseSeeder (areas e cursos existem)
 *
 * Ordem de criação de perfis:
 *   1. teacher_profiles  (supervisor_id em student_profiles referencia este)
 *   2. student_profiles
 *   3. coordinator_profiles
 *   4. secretary_profiles
 *   5. admin_profiles
 *   6. organ_members
 */
class OrganizationProfileSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // ── Helpers ───────────────────────────────────────────────────────
        $user   = fn(string $email) => DB::table('users')->where('email', $email)->value('id');
        $organ  = fn(string $type)  => DB::table('organs')->where('type', $type)->value('id');
        $course = fn(string $code)  => DB::table('courses')->where('code', $code)->value('id');
        $area   = fn(string $name)  => DB::table('scientific_areas')->where('name', $name)->value('id');

        // ── IDs dos órgãos ────────────────────────────────────────────────
        $nucleoId    = $organ('nucleus');
        $comiteId    = $organ('scientific_committee');
        $bioeticaId  = $organ('bioethics_committee');
        $direcaoId   = $organ('scientific_direction');

        // ── 1. teacher_profiles ───────────────────────────────────────────

        // João Docente — supervisor de Sofia
        $joaoTeacherProfileId = DB::table('teacher_profiles')->insertGetId([
            'user_id'            => $user('docente@iscisa.ac.mz'),
            'scientific_area_id' => $area('Saúde Pública'),
            'department'         => 'Departamento de Medicina',
            'academic_degree'    => 'doutoramento',
            'is_internal'        => true,
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);

        // Ana Revisora
        $anaTeacherProfileId = DB::table('teacher_profiles')->insertGetId([
            'user_id'            => $user('revisora@iscisa.ac.mz'),
            'scientific_area_id' => $area('Saúde Pública'),
            'department'         => 'Departamento de Saúde Pública',
            'academic_degree'    => 'mestrado',
            'is_internal'        => true,
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);

        // Maria Coordenadora — também tem teacher_profile (acumula roles)
        $mariaTeacherProfileId = DB::table('teacher_profiles')->insertGetId([
            'user_id'            => $user('coord@iscisa.ac.mz'),
            'scientific_area_id' => $area('Enfermagem'),
            'department'         => 'Departamento de Enfermagem',
            'academic_degree'    => 'doutoramento',
            'is_internal'        => true,
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);

        // ── 2. student_profiles ───────────────────────────────────────────

        DB::table('student_profiles')->insert([
            'user_id'        => $user('estudante@iscisa.ac.mz'),
            'course_id'      => $course('MED'),
            'supervisor_id'  => $joaoTeacherProfileId, // → teacher_profiles.id
            'student_number' => 'MED2023001',
            'created_at'     => $now,
            'updated_at'     => $now,
        ]);

        // ── 3. coordinator_profiles ───────────────────────────────────────

        DB::table('coordinator_profiles')->insert([
            'user_id'            => $user('coord@iscisa.ac.mz'),
            'scientific_area_id' => $area('Enfermagem'),
            'course_id'          => $course('ENF'),
            'office'             => 'Gabinete de Coordenação — Edifício B',
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);

        // ── 4. secretary_profiles ─────────────────────────────────────────

        DB::table('secretary_profiles')->insert([
            'user_id'            => $user('secretario@iscisa.ac.mz'),
            'organ_id'           => $nucleoId,
            'scientific_area_id' => $area('Saúde Pública'),
            'office'             => 'Secretaria do Núcleo Científico — Saúde Pública',
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);

        DB::table('secretary_profiles')->insert([
            'user_id'            => $user('secretario.enfermagem@iscisa.ac.mz'),
            'organ_id'           => $nucleoId,
            'scientific_area_id' => $area('Enfermagem'),
            'office'             => 'Secretaria do Núcleo Científico — Enfermagem',
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);

        DB::table('secretary_profiles')->insert([
            'user_id'            => $user('secretario.reabilitacao@iscisa.ac.mz'),
            'organ_id'           => $nucleoId,
            'scientific_area_id' => $area('Reabilitação'),
            'office'             => 'Secretaria do Núcleo Científico — Reabilitação',
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);

        // Secretaria da Direcção Científica — ligada ao organ 'scientific_direction'
        DB::table('secretary_profiles')->insert([
            'user_id'            => $user('sdireccao@iscisa.ac.mz'),
            'organ_id'           => $direcaoId,
            'scientific_area_id' => null,
            'office'             => 'Secretaria da Direcção Científica',
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);

        // ── 5. admin_profiles ─────────────────────────────────────────────

        DB::table('admin_profiles')->insert([
            'user_id'      => $user('admin@iscisa.ac.mz'),
            'organ_id'     => null, // acesso global
            'access_scope' => 'global',
            'created_at'   => $now,
            'updated_at'   => $now,
        ]);

        // ── 6. organ_members ──────────────────────────────────────────────
        // Cargo formal nos órgãos (diferente das roles de acesso)

        $members = [
            // Núcleo
            ['organ_id' => $nucleoId,   'user_id' => $user('coord@iscisa.ac.mz'),              'role' => 'coordinator'],
            ['organ_id' => $nucleoId,   'user_id' => $user('secretario@iscisa.ac.mz'),         'role' => 'member'],
            ['organ_id' => $nucleoId,   'user_id' => $user('secretario.enfermagem@iscisa.ac.mz'),  'role' => 'member'],
            ['organ_id' => $nucleoId,   'user_id' => $user('secretario.reabilitacao@iscisa.ac.mz'), 'role' => 'member'],
            ['organ_id' => $nucleoId,   'user_id' => $user('docente@iscisa.ac.mz'),            'role' => 'reviewer'],
            ['organ_id' => $nucleoId,   'user_id' => $user('revisora@iscisa.ac.mz'),           'role' => 'reviewer'],

            // Comitê Científico
            ['organ_id' => $comiteId,   'user_id' => $user('coord@iscisa.ac.mz'),       'role' => 'president'],
            ['organ_id' => $comiteId,   'user_id' => $user('docente@iscisa.ac.mz'),     'role' => 'reviewer'],
            ['organ_id' => $comiteId,   'user_id' => $user('revisora@iscisa.ac.mz'),    'role' => 'reviewer'],

            // Bioética
            ['organ_id' => $bioeticaId, 'user_id' => $user('revisora@iscisa.ac.mz'),   'role' => 'member'],
            // Direcção Científica
            ['organ_id' => $direcaoId,  'user_id' => $user('sdireccao@iscisa.ac.mz'), 'role' => 'member'],
        ];

        foreach ($members as $member) {
            DB::table('organ_members')->updateOrInsert(
                ['organ_id' => $member['organ_id'], 'user_id' => $member['user_id']],
                array_merge($member, ['created_at' => $now, 'updated_at' => $now])
            );
        }
    }
}
