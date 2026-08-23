<?php

namespace Modules\Monograph\Tests\Unit;

use Tests\TestCase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Monograph\app\Enums\MonographStatus;
use Modules\Monograph\app\Services\MonographService;
use App\Models\MonographDocument;
use Modules\Monograph\app\Models\MonographSubmission;
use Modules\User\app\Models\User;

class MonographUnitTest extends TestCase
{
    use \Illuminate\Foundation\Testing\RefreshDatabase;

    public function test_student_submit_supervisor_endorse_and_secretary_verify_creates_defense()
    {
        // Seed minimal users/profiles
        $this->seed(\Modules\Auth\database\seeders\TestUserSeeder::class);
        $this->seed(\Modules\Organization\database\seeders\OrganizationDatabaseSeeder::class);

        // Prepare storage and a fake file
        Storage::fake('local');
        $fileContent = 'PDF content';
        Storage::disk('local')->put('test-monograph.pdf', $fileContent);

        $student = User::where('email', 'estudante@iscisa.ac.mz')->first();
        $supervisor = User::where('email', 'docente@iscisa.ac.mz')->first();
        $secretary = User::where('email', 'secretario.direccao@iscisa.ac.mz')->first();

        // Create monograph directly (without protocol)
        $monographModel = \Modules\Monograph\app\Models\Monograph::create([
            'protocol_id' => null,
            'student_id'  => $student->id,
            'supervisor_id' => DB::table('teacher_profiles')->where('user_id', $supervisor->id)->value('id'),
            'code'        => 'TEST-M' . Str::random(6),
            'title'       => 'Teste Unitario',
            'status'      => MonographStatus::AguardaSubmissao,
        ]);

        // Create MonographDocument and Submission
        $doc = MonographDocument::create([
            'monograph_id' => $monographModel->id,
            'submitted_by' => $student->id,
            'document_type'=> 'monografia_final',
            'file_name'    => 'test-monograph.pdf',
            'file_path'    => 'test-monograph.pdf',
            'version'      => 1,
            'status'       => 'pendente',
        ]);

        MonographSubmission::create([
            'monograph_id' => $monographModel->id,
            'monograph_document_id' => $doc->id,
            'version' => 1,
            'submitted_at' => now(),
        ]);

        // Mark as submitted
        $monographModel->update(['status' => MonographStatus::Submetida]);

        $service = app(MonographService::class);

        Event::fake();

        // Supervisor endorses
        $service->endorse($monographModel, $supervisor, true);
        $this->assertEquals(MonographStatus::VerificacaoDocumental, $monographModel->fresh()->status);

        // Secretary verifies (as secretary role)
        $service->verifyDocuments($monographModel->fresh(), $secretary, 'secretary', true);
        $this->assertEquals(MonographStatus::Verificada, $monographModel->fresh()->status);

        // After verification, a Defense should exist
        $this->assertDatabaseHas('defenses', ['monograph_id' => $monographModel->id]);

        Event::assertDispatched(\Modules\Monograph\app\Events\MonographVerified::class);
    }
}
