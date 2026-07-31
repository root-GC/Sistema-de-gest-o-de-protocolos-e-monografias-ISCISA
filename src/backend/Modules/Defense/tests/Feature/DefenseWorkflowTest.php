<?php

namespace Modules\Defense\Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Defense\app\Models\Defense;
use Modules\Defense\app\Enums\DefenseStatus;
use Modules\User\app\Models\User;
use Illuminate\Support\Facades\DB;

class DefenseWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private Defense $defense;
    private User $coordinator;
    private array $juryMembers = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(); // corre AuthDatabaseSeeder, OrganizationDatabaseSeeder, MonographTestSeeder, DefenseTestSeeder

        $this->defense = Defense::first();
        $this->coordinator = User::where('email', 'coord@iscisa.ac.mz')->first();

        $this->attachRole($this->coordinator, 'coordinator');

        // garante coordinator_profile na mesma área do estudante
        $this->ensureCoordinatorProfile();

        // três docentes para servir de júri, distintos do supervisor
        $this->juryMembers = $this->createJuryCandidates();
    }

    /** @test */
    public function coordenador_do_mesmo_curso_consegue_atribuir_juri_quando_a_area_do_topico_nao_bate(): void
    {
        $protocol = DB::table('protocols')->where('id', $this->defense->monograph->protocol_id)->first();
        $topicId = $protocol->topic_id;
        $currentAreaId = DB::table('topics')->where('id', $topicId)->value('scientific_area_id');
        $alternateAreaId = DB::table('scientific_areas')->where('id', '!=', $currentAreaId)->value('id');

        $this->assertNotNull($alternateAreaId);

        DB::table('topics')->where('id', $topicId)->update(['scientific_area_id' => $alternateAreaId]);

        $response = $this->actingAs($this->coordinator, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/jury", [
                'members' => [
                    ['teacher_id' => $this->juryMembers[0]->id, 'jury_role' => 'presidente'],
                    ['teacher_id' => $this->juryMembers[1]->id, 'jury_role' => 'arguente'],
                    ['teacher_id' => $this->juryMembers[2]->id, 'jury_role' => 'orientador'],
                ],
            ]);

        $response->assertOk();
        $this->assertEquals('juri_definido', $response->json('status'));
    }

    /** @test */
    public function coordenador_da_area_consegue_atribuir_juri(): void
    {
        $response = $this->actingAs($this->coordinator, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/jury", [
                'members' => [
                    ['teacher_id' => $this->juryMembers[0]->id, 'jury_role' => 'presidente'],
                    ['teacher_id' => $this->juryMembers[1]->id, 'jury_role' => 'arguente'],
                    ['teacher_id' => $this->juryMembers[2]->id, 'jury_role' => 'orientador'],
                ],
            ]);

        $response->assertOk();
        $this->assertEquals('juri_definido', $response->json('status'));
        $this->assertDatabaseCount('defense_juries', 3);
    }

    /** @test */
    public function supervisor_nao_pode_estar_no_juri(): void
    {
        $supervisorTeacherId = $this->defense->monograph->supervisor_id;

        $response = $this->actingAs($this->coordinator, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/jury", [
                'members' => [
                    ['teacher_id' => $supervisorTeacherId, 'jury_role' => 'presidente'],
                    ['teacher_id' => $this->juryMembers[1]->id, 'jury_role' => 'arguente'],
                    ['teacher_id' => $this->juryMembers[2]->id, 'jury_role' => 'orientador'],
                ],
            ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function coordenador_consegue_propor_data_apos_juri_definido(): void
    {
        $this->assignJury();

        $response = $this->actingAs($this->coordinator, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/schedule/propose", [
                'scheduled_at' => now()->addDays(10)->toDateTimeString(),
                'location'     => 'Sala 2, Edifício B',
            ]);

        $response->assertOk();
        $this->assertEquals('data_proposta', $response->json('status'));
        $this->assertDatabaseCount('defense_jury_availability', 3);
    }

    /** @test */
    public function presidente_nao_pode_responder_a_proposta(): void
    {
        $this->assignJury();
        $this->proposeSchedule();

        $presidente = User::find($this->juryMembers[0]->user_id);

        $response = $this->actingAs($presidente, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/schedule/respond", [
                'accepted' => true,
            ]);

        $response->assertForbidden();
    }

    /** @test */
    public function arguente_aceitar_avanca_para_defesa_agendada(): void
    {
        $this->assignJury();
        $this->proposeSchedule();

        $arguente = User::find($this->juryMembers[1]->user_id);

        $response = $this->actingAs($arguente, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/schedule/respond", [
                'accepted' => true,
            ]);

        $response->assertOk();
        $this->assertEquals('defesa_agendada', $response->json('status'));
    }

    /** @test */
    public function arguente_recusar_exige_alternativa_ou_nota(): void
    {
        $this->assignJury();
        $this->proposeSchedule();

        $arguente = User::find($this->juryMembers[1]->user_id);

        $response = $this->actingAs($arguente, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/schedule/respond", [
                'accepted' => false,
            ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function arguente_recusar_com_alternativa_mantem_estado_data_proposta(): void
    {
        $this->assignJury();
        $this->proposeSchedule();

        $arguente = User::find($this->juryMembers[1]->user_id);

        $response = $this->actingAs($arguente, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/schedule/respond", [
                'accepted'             => false,
                'alternative_datetime' => now()->addDays(15)->toDateTimeString(),
                'note'                 => 'Estarei em conferência nessa data.',
            ]);

        $response->assertOk();
        $this->assertEquals('data_proposta', $response->json('status'));
    }

    /** @test */
    public function coordenador_lanca_nota_com_exigencia_de_correccoes(): void
    {
        $this->assignJury();
        $this->proposeSchedule();
        $this->acceptSchedule();

        $response = $this->actingAs($this->coordinator, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/grade", [
                'grade'                => 16.5,
                'requires_corrections' => true,
                'notes'                => 'Corrigir capítulo 3 e formatação das referências.',
            ]);

        $response->assertOk();
        $this->assertEquals('defendida', $response->json('status'));
    }

    /** @test */
    public function upload_da_acta_com_correccoes_exigidas_vai_para_aguarda_correcoes(): void
    {
        $this->assignJury();
        $this->proposeSchedule();
        $this->acceptSchedule();
        $this->recordGrade(requiresCorrections: true);

        $response = $this->actingAs($this->coordinator, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/minutes", [
                'file' => \Illuminate\Http\UploadedFile::fake()->create('acta.pdf', 200, 'application/pdf'),
            ]);

        $response->assertOk();
        $this->assertEquals('aguarda_correcoes_finais', $response->json('status'));
    }

    /** @test */
    public function upload_da_acta_sem_correccoes_encerra_directamente(): void
    {
        $this->assignJury();
        $this->proposeSchedule();
        $this->acceptSchedule();
        $this->recordGrade(requiresCorrections: false);

        $response = $this->actingAs($this->coordinator, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/minutes", [
                'file' => \Illuminate\Http\UploadedFile::fake()->create('acta.pdf', 200, 'application/pdf'),
            ]);

        $response->assertOk();
        $this->assertEquals('encerrada', $response->json('status'));
    }

    /** @test */
    public function estudante_submete_versao_final_apos_correccoes_exigidas(): void
    {
        $this->assignJury();
        $this->proposeSchedule();
        $this->acceptSchedule();
        $this->recordGrade(requiresCorrections: true);
        $this->uploadMinutes();

        $student = $this->defense->monograph->student;

        $response = $this->actingAs($student, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/final-document", [
                'file' => \Illuminate\Http\UploadedFile::fake()->create('final_v1.pdf', 400, 'application/pdf'),
            ]);

        $response->assertOk();
        $this->assertEquals('correcoes_submetidas', $response->json('status'));
    }

    /** @test */
    public function coordenador_aprova_versao_final_e_encerra(): void
    {
        $this->assignJury();
        $this->proposeSchedule();
        $this->acceptSchedule();
        $this->recordGrade(requiresCorrections: true);
        $this->uploadMinutes();
        $this->submitFinalDocument();

        $response = $this->actingAs($this->coordinator, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/final-document/validate", [
                'approved' => true,
            ]);

        $response->assertOk();
        $this->assertEquals('encerrada', $response->json('status'));
    }

    /** @test */
    public function coordenador_rejeita_versao_final_e_devolve(): void
    {
        $this->assignJury();
        $this->proposeSchedule();
        $this->acceptSchedule();
        $this->recordGrade(requiresCorrections: true);
        $this->uploadMinutes();
        $this->submitFinalDocument();

        $response = $this->actingAs($this->coordinator, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/final-document/validate", [
                'approved' => false,
                'notes'    => 'Ainda falta corrigir a bibliografia.',
            ]);

        $response->assertOk();
        $this->assertEquals('aguarda_correcoes_finais', $response->json('status'));
    }

    // ── helpers ─────────────────────────────────────────────────────────

    private function assignJury(): void
    {
        $this->actingAs($this->coordinator, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/jury", [
                'members' => [
                    ['teacher_id' => $this->juryMembers[0]->id, 'jury_role' => 'presidente'],
                    ['teacher_id' => $this->juryMembers[1]->id, 'jury_role' => 'arguente'],
                    ['teacher_id' => $this->juryMembers[2]->id, 'jury_role' => 'orientador'],
                ],
            ]);
    }

    private function proposeSchedule(): void
    {
        $this->actingAs($this->coordinator, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/schedule/propose", [
                'scheduled_at' => now()->addDays(10)->toDateTimeString(),
                'location'     => 'Sala 2',
            ]);
    }

    private function acceptSchedule(): void
    {
        $arguente = User::find($this->juryMembers[1]->user_id);
        $this->actingAs($arguente, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/schedule/respond", ['accepted' => true]);
    }

    private function recordGrade(bool $requiresCorrections): void
    {
        $this->actingAs($this->coordinator, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/grade", [
                'grade'                => 15,
                'requires_corrections' => $requiresCorrections,
                'notes'                => $requiresCorrections ? 'Corrigir X' : null,
            ]);
    }

    private function uploadMinutes(): void
    {
        $this->actingAs($this->coordinator, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/minutes", [
                'file' => \Illuminate\Http\UploadedFile::fake()->create('acta.pdf', 200, 'application/pdf'),
            ]);
    }

    private function submitFinalDocument(): void
    {
        $student = $this->defense->monograph->student;
        $this->actingAs($student, 'sanctum')
            ->postJson("/api/defenses/{$this->defense->id}/final-document", [
                'file' => \Illuminate\Http\UploadedFile::fake()->create('final.pdf', 400, 'application/pdf'),
            ]);
    }

    private function attachRole(User $user, string $roleName): void
    {
        $roleId = DB::table('roles')->where('name', $roleName)->value('id');
        DB::table('user_roles')->updateOrInsert(
            ['user_id' => $user->id, 'role_id' => $roleId],
            ['created_at' => now(), 'updated_at' => now()]
        );
    }

    private function ensureCoordinatorProfile(): void
    {
        $areaId = DB::table('scientific_areas')->value('id');
        DB::table('coordinator_profiles')->updateOrInsert(
            ['user_id' => $this->coordinator->id],
            ['scientific_area_id' => $areaId, 'course_id' => DB::table('courses')->value('id'), 'created_at' => now(), 'updated_at' => now()]
        );
    }

    /** @return \Modules\User\app\Models\TeacherProfile[] */
    private function createJuryCandidates(): array
    {
        $areaId = DB::table('scientific_areas')->value('id');
        $candidates = [];

        foreach (['jury1@teste.mz', 'jury2@teste.mz', 'jury3@teste.mz'] as $email) {
            $user = User::factory()->create(['email' => $email]);
            $teacherProfileId = DB::table('teacher_profiles')->insertGetId([
                'user_id' => $user->id,
                'scientific_area_id' => $areaId,
                'department' => 'Depto Teste',
                'academic_degree' => 'doutoramento',
                'is_internal' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $candidates[] = (object) ['id' => $teacherProfileId, 'user_id' => $user->id];
        }

        return $candidates;
    }
}