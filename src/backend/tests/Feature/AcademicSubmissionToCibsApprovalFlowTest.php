<?php

namespace Tests\Feature;

use App\Models\DocumentRevision;
use App\Models\WorkflowEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Modules\Protocol\app\Models\DeliberationMeetingItem;
use Modules\Protocol\app\Models\Document;
use Modules\Protocol\app\Models\EvaluationCriterion;
use Modules\Protocol\app\Models\EvaluationForm;
use Modules\Protocol\app\Models\Opinion;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\ProtocolDocumentRequirement;
use Modules\Protocol\app\Models\ProtocolHistory;
use Modules\Protocol\app\Models\ProtocolReviewAssignment;
use Modules\Protocol\app\Models\ReviewerEvaluation;
use Modules\Protocol\app\Models\Topic;
use Modules\Protocol\app\Models\TopicHistory;
use Modules\Protocol\app\Models\TopicReviewComment;
use Modules\Protocol\app\Models\TopicReviewEvaluation;
use Modules\Protocol\app\Services\DeliberationMeetingService;
use Modules\Protocol\app\Services\EvaluationService;
use Modules\Protocol\app\Services\ProtocolService;
use Modules\Protocol\app\Services\TopicService;
use Modules\Protocol\database\seeders\OrganDocumentRequirementSeeder;
use Modules\User\app\Models\Course;
use Modules\User\app\Models\Organ;
use Modules\User\app\Models\Permission;
use Modules\User\app\Models\Role;
use Modules\User\app\Models\ScientificArea;
use Modules\User\app\Models\SecretaryProfile;
use Modules\User\app\Models\StudentProfile;
use Modules\User\app\Models\TeacherProfile;
use Modules\User\app\Models\User;
use Tests\TestCase;

class AcademicSubmissionToCibsApprovalFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_student_reaches_cibs_approval_after_rejection_and_resubmission_in_every_stage(): void
    {
        Storage::fake('public');
        Event::fake();
        Carbon::setTestNow('2026-08-31 08:00:00 UTC');

        $context = $this->createContext();
        $topicService = app(TopicService::class);
        $protocolService = app(ProtocolService::class);

        $rejectedBySupervisor = $this->submitTopic($context, 'Tema inicial para rejeição do supervisor');
        $topicService->rejectBySupervisor($rejectedBySupervisor, $context['supervisor'], 'Corrigir o recorte do tema.');
        $this->assertSame(Topic::STATUS_REJECTED_SUPERVISOR, $rejectedBySupervisor->fresh()->status);

        $rejectedByNucleus = $this->submitTopic($context, 'Tema reenviado para avaliação do Núcleo');
        $topicService->approveBySupervisor($rejectedByNucleus, $context['supervisor'], 'Encaminhado ao Núcleo.');
        $topicService->assignReviewers($rejectedByNucleus, [$context['nucleusReviewers'][0]->teacherProfile->id], $context['nucleusSecretary']);
        TopicReviewComment::create([
            'topic_id' => $rejectedByNucleus->id,
            'user_id' => $context['nucleusReviewers'][0]->id,
            'content' => 'Delimitação metodológica insuficiente.',
            'status' => TopicReviewComment::STATUS_ACTIVE,
        ]);
        $topicService->submitEvaluation($rejectedByNucleus, $context['nucleusReviewers'][0], [
            'decision' => TopicReviewEvaluation::DECISION_REJECTED,
        ]);
        $this->assertSame(Topic::STATUS_REJECTED_NUCLEO, $rejectedByNucleus->fresh()->status);

        $approvedTopic = $this->submitTopic($context, 'Tema aprovado pelo Núcleo');
        $topicService->approveBySupervisor($approvedTopic, $context['supervisor'], 'Aprovado pelo supervisor.');
        $topicService->assignReviewers($approvedTopic, [$context['nucleusReviewers'][1]->teacherProfile->id], $context['nucleusSecretary']);
        $topicService->submitEvaluation($approvedTopic, $context['nucleusReviewers'][1], [
            'decision' => TopicReviewEvaluation::DECISION_APPROVED,
        ]);
        $this->assertSame(Topic::STATUS_APPROVED_NUCLEO, $approvedTopic->fresh()->status);

        $protocol = $this->submitProtocol($context, $approvedTopic);
        $protocolService->rejectBySupervisor($protocol, $context['supervisor'], 'A metodologia do protocolo precisa de revisão.');
        $this->assertSame(Protocol::STATUS_REJECTED_SUPERVISOR, $protocol->fresh()->status);

        $protocol = $this->submitProtocol($context, $approvedTopic);
        $this->assertSame(2, $protocol->submission_number);
        $protocolService->approveBySupervisor($protocol, $context['supervisor']);
        $this->approveRequiredDocuments($protocol, $context['ccSecretary'], Protocol::ORGAN_COMITE_CIENTIFICO);
        $this->assignCcReviewersAndDecide(
            $protocol,
            $context['ccSecretary'],
            $context['ccReviewerPairs'][0],
            ReviewerEvaluation::DECISION_NOT_APPROVED
        );
        $this->assertSame(Protocol::STATUS_REJECTED_CC, $protocol->fresh()->status);
        $this->assertSame(1, ProtocolReviewAssignment::onlyTrashed()
            ->where('protocol_id', $protocol->id)
            ->where('organ_id', $context['ccSecretary']->secretaryProfile->organ_id)
            ->count());

        $protocol = $this->submitProtocol($context, $approvedTopic);
        $this->assertSame(3, $protocol->submission_number);
        $protocolService->approveBySupervisor($protocol, $context['supervisor']);
        $this->approveRequiredDocuments($protocol, $context['ccSecretary'], Protocol::ORGAN_COMITE_CIENTIFICO);
        $this->assignCcReviewersAndDecide(
            $protocol,
            $context['ccSecretary'],
            $context['ccReviewerPairs'][1],
            ReviewerEvaluation::DECISION_APPROVED
        );
        $this->assertSame(Protocol::STATUS_PARECER_PENDING_CC_SIGNATURE, $protocol->fresh()->status);
        $this->signLatestOpinion($protocol, Protocol::ORGAN_COMITE_CIENTIFICO, $context['ccSecretary']);
        $this->assertSame(Protocol::STATUS_DOCUMENTS_PENDING_CIBS, $protocol->fresh()->status);

        $this->approveRequiredDocuments($protocol, $context['cibsSecretary'], Protocol::ORGAN_COMITE_BIOETICA);
        $this->assignCibsReviewerAndDecide(
            $protocol,
            $context['cibsSecretary'],
            $context['cibsReviewerPairs'][0],
            ReviewerEvaluation::DECISION_NOT_APPROVED
        );
        $this->assertSame(Protocol::STATUS_REJECTED_BIOETICA, $protocol->fresh()->status);

        $protocol = $this->submitProtocol($context, $approvedTopic);
        $this->assertSame(4, $protocol->submission_number);
        $protocolService->approveBySupervisor($protocol, $context['supervisor']);
        $this->approveRequiredDocuments($protocol, $context['ccSecretary'], Protocol::ORGAN_COMITE_CIENTIFICO);
        $this->assignCcReviewersAndDecide(
            $protocol,
            $context['ccSecretary'],
            $context['ccReviewerPairs'][2],
            ReviewerEvaluation::DECISION_APPROVED
        );
        $this->signLatestOpinion($protocol, Protocol::ORGAN_COMITE_CIENTIFICO, $context['ccSecretary']);
        $this->approveRequiredDocuments($protocol, $context['cibsSecretary'], Protocol::ORGAN_COMITE_BIOETICA);
        $this->assignCibsReviewerAndDecide(
            $protocol,
            $context['cibsSecretary'],
            $context['cibsReviewerPairs'][1],
            ReviewerEvaluation::DECISION_APPROVED
        );
        $this->assertSame(Protocol::STATUS_PARECER_PENDING_CIBS_SIGNATURE, $protocol->fresh()->status);
        $this->signLatestOpinion($protocol, Protocol::ORGAN_COMITE_BIOETICA, $context['cibsSecretary']);

        $protocol = $protocol->fresh();
        $this->assertSame(Protocol::STATUS_APPROVED_FINAL, $protocol->status);
        $this->assertSame(4, $protocol->submission_number);
        $this->assertSame(3, $protocol->cc_version);
        $this->assertSame(2, $protocol->cb_version);
        $this->assertSame('APROVADO', $protocol->version);

        $this->assertSame(4, Document::query()->where('protocol_id', $protocol->id)->count());
        $this->assertSame(3, Document::query()->where('protocol_id', $protocol->id)->where('status', Document::STATUS_INACTIVE)->count());
        $this->assertSame(1, Document::query()->where('protocol_id', $protocol->id)->where('status', Document::STATUS_ACTIVE)->count());
        $this->assertGreaterThanOrEqual(4, DocumentRevision::query()
            ->where('documentable_type', Protocol::class)
            ->where('documentable_id', $protocol->id)
            ->count());

        $this->assertSame(1, TopicHistory::query()->where('topic_id', $rejectedBySupervisor->id)->where('action', 'supervisor_rejected')->count());
        $this->assertSame(1, TopicHistory::query()->where('topic_id', $rejectedByNucleus->id)->where('action', 'review_completed')->count());
        $this->assertSame(1, TopicHistory::query()->where('topic_id', $approvedTopic->id)->where('action', 'review_completed')->count());
        $this->assertSame(1, ProtocolHistory::query()->where('protocol_id', $protocol->id)->where('action', 'supervisor_rejected')->count());
        $this->assertSame(2, ProtocolHistory::query()->where('protocol_id', $protocol->id)->where('action', 'rejected')->count());
        $this->assertSame(3, ProtocolHistory::query()->where('protocol_id', $protocol->id)->where('action', 'resubmitted')->count());
        $this->assertGreaterThanOrEqual(1, WorkflowEvent::query()->where('subject_type', 'topic')->where('action', 'supervisor_rejected')->count());
        $this->assertGreaterThanOrEqual(2, WorkflowEvent::query()->where('subject_type', 'protocol')->where('action', 'rejected')->count());
    }

    private function createContext(): array
    {
        $nucleus = Organ::create([
            'name' => 'Núcleo de Teste',
            'type' => Protocol::ORGAN_TYPE_NUCLEUS,
            'description' => 'Núcleo para teste de fluxo.',
        ]);
        $cc = Organ::create([
            'name' => 'Comité Científico',
            'type' => Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE,
            'description' => 'Comité para teste de fluxo.',
        ]);
        $cibs = Organ::create([
            'name' => 'Comité de Bioética',
            'type' => Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE,
            'description' => 'Comité para teste de fluxo.',
        ]);

        $this->seed(OrganDocumentRequirementSeeder::class);

        $area = ScientificArea::create(['organ_id' => $nucleus->id, 'name' => 'Saúde Pública']);
        $course = Course::create(['scientific_area_id' => $area->id, 'name' => 'Medicina', 'code' => 'MED-FLOW']);

        EvaluationCriterion::create([
            'group_name' => 'Teste',
            'name' => 'Critério obrigatório do fluxo',
            'order_column' => 1,
            'is_active' => true,
        ]);

        $supervisor = $this->teacher('Supervisor', 'supervisor.flow@example.test', $area);
        $student = $this->user('Estudante', 'estudante.flow@example.test');
        StudentProfile::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'supervisor_id' => $supervisor->teacherProfile->id,
            'student_number' => 'FLOW-2026-001',
        ]);

        $nucleusSecretary = $this->secretary('Secretária do Núcleo', 'secretaria.nc.flow@example.test', $nucleus);
        $ccSecretary = $this->secretary('Secretária do CC', 'secretaria.cc.flow@example.test', $cc);
        $cibsSecretary = $this->secretary('Secretária do CIBS', 'secretaria.cibs.flow@example.test', $cibs);
        $nucleusReviewers = [
            $this->teacher('Revisor NC Um', 'revisor.nc.1.flow@example.test', $area, true),
            $this->teacher('Revisor NC Dois', 'revisor.nc.2.flow@example.test', $area, true),
        ];
        $ccReviewers = collect(range(1, 6))->map(
            fn (int $number) => $this->teacher("Revisor CC {$number}", "revisor.cc.{$number}.flow@example.test", $area, true)
        )->all();
        $cibsReviewers = collect(range(1, 4))->map(
            fn (int $number) => $this->teacher("Revisor CIBS {$number}", "revisor.cibs.{$number}.flow@example.test", $area, true)
        )->all();

        foreach ($cibsReviewers as $reviewer) {
            DB::table('organ_members')->insert([
                'organ_id' => $cibs->id,
                'user_id' => $reviewer->id,
                'role' => 'reviewer',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return [
            'area' => $area,
            'course' => $course,
            'student' => $student,
            'supervisor' => $supervisor,
            'nucleusSecretary' => $nucleusSecretary,
            'ccSecretary' => $ccSecretary,
            'cibsSecretary' => $cibsSecretary,
            'nucleusReviewers' => $nucleusReviewers,
            'ccReviewerPairs' => array_chunk($ccReviewers, 2),
            'cibsReviewerPairs' => array_chunk($cibsReviewers, 2),
        ];
    }

    private function submitTopic(array $context, string $title): Topic
    {
        return app(TopicService::class)->submit([
            'scientific_area_id' => $context['area']->id,
            'course_id' => $context['course']->id,
            'title' => $title,
        ], $context['student'], UploadedFile::fake()->create('tema.docx', 20, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))['topic'];
    }

    private function submitProtocol(array $context, Topic $topic): Protocol
    {
        return app(ProtocolService::class)->submit(
            $context['student'],
            $topic->fresh(),
            UploadedFile::fake()->create('protocolo.docx', 20, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
            'protocol',
            $this->filesFor(ProtocolDocumentRequirement::CC_REQUIRED_DOCUMENTS),
            $this->filesFor(ProtocolDocumentRequirement::CIBS_REQUIRED_DOCUMENTS),
        );
    }

    private function filesFor(array $requirements): array
    {
        return collect(array_keys($requirements))
            ->mapWithKeys(fn (string $key) => [$key => UploadedFile::fake()->create("{$key}.pdf", 20, 'application/pdf')])
            ->all();
    }

    private function approveRequiredDocuments(Protocol $protocol, User $secretary, string $organ): void
    {
        $requirements = ProtocolDocumentRequirement::query()
            ->where('protocol_id', $protocol->id)
            ->where('submission_number', $protocol->submission_number)
            ->where('required_for_organ', $organ)
            ->whereNull('archived_at')
            ->orderBy('id')
            ->get();

        $this->assertNotEmpty($requirements, "Não foram encontrados anexos para {$organ}.");
        foreach ($requirements as $requirement) {
            app(ProtocolService::class)->reviewRequiredDocument($requirement, true, null, $secretary);
        }
    }

    private function assignCcReviewersAndDecide(Protocol $protocol, User $secretary, array $reviewers, string $decision): void
    {
        app(ProtocolService::class)->assignReviewersToOrgan(
            $protocol->fresh(),
            array_map(fn (User $reviewer) => $reviewer->teacherProfile->id, $reviewers),
            $secretary,
            Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE,
        );

        $this->deliberateAndDecide(
            $protocol,
            Protocol::ORGAN_COMITE_CIENTIFICO,
            $secretary,
            $reviewers[0],
            $decision,
        );
    }

    private function assignCibsReviewerAndDecide(Protocol $protocol, User $secretary, array $reviewers, string $decision): void
    {
        app(ProtocolService::class)->assignReviewersToBioetica(
            $protocol->fresh(),
            $reviewers[0]->teacherProfile->id,
            array_map(fn (User $reviewer) => $reviewer->teacherProfile->id, $reviewers),
            $secretary,
        );

        $this->deliberateAndDecide(
            $protocol,
            Protocol::ORGAN_COMITE_BIOETICA,
            $secretary,
            $reviewers[0],
            $decision,
        );
    }

    private function deliberateAndDecide(Protocol $protocol, string $organ, User $secretary, User $reviewer, string $decision): void
    {
        $form = EvaluationForm::query()
            ->where('protocol_id', $protocol->id)
            ->where('version', $protocol->fresh()->version)
            ->where('organ', $organ)
            ->where('form_type', EvaluationForm::FORM_TYPE_EVALUATION)
            ->firstOrFail();
        $meetingService = app(DeliberationMeetingService::class);
        $scheduledAt = now()->addMinute();
        $meeting = $meetingService->create($secretary, [
            'scheduled_at' => $scheduledAt->toIso8601String(),
            'location' => 'Sala de deliberação',
            'notes' => 'Fluxo de integração.',
            'evaluation_form_ids' => [$form->id],
        ]);

        Carbon::setTestNow($scheduledAt);
        $meeting = $meetingService->startMeeting($meeting, $secretary);
        $meetingService->closeItem(
            $meeting,
            $meeting->items->first(),
            $reviewer,
            DeliberationMeetingItem::STATUS_DELIBERATED,
        );

        app(EvaluationService::class)->decide(
            $form->fresh(),
            $reviewer,
            $decision,
            'Decisão registada pelo teste de fluxo.',
        );
    }

    private function signLatestOpinion(Protocol $protocol, string $organ, User $secretary): void
    {
        $opinion = Opinion::query()
            ->where('protocol_id', $protocol->id)
            ->where('organ', $organ)
            ->latest('id')
            ->firstOrFail();

        app(ProtocolService::class)->submitSignedParecer(
            $protocol->fresh(),
            $opinion,
            $secretary,
            UploadedFile::fake()->create('parecer-assinado.pdf', 20, 'application/pdf'),
        );
    }

    private function secretary(string $name, string $email, Organ $organ): User
    {
        $user = $this->user($name, $email);
        $profile = SecretaryProfile::create([
            'user_id' => $user->id,
            'organ_id' => $organ->id,
            'office' => 'Secretaria',
        ]);
        $profile->setRelation('organ', $organ);
        $user->setRelation('secretaryProfile', $profile);
        $this->withPermission($user, 'secretary', 'protocol.assign');

        return $user;
    }

    private function teacher(string $name, string $email, ScientificArea $area, bool $reviewer = false): User
    {
        $user = $this->user($name, $email);
        $profile = TeacherProfile::create([
            'user_id' => $user->id,
            'scientific_area_id' => $area->id,
            'department' => 'Medicina',
            'academic_degree' => 'mestrado',
            'is_internal' => true,
        ]);
        $user->setRelation('teacherProfile', $profile);

        if ($reviewer) {
            $this->withPermission($user, 'reviewer', 'protocol.evaluate');
        } else {
            $this->withPermission($user, 'supervisor', 'protocol.evaluate');
        }

        return $user;
    }

    private function user(string $name, string $email): User
    {
        return User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make('password'),
            'status' => 'active',
        ]);
    }

    private function withPermission(User $user, string $roleName, string $permissionCode): void
    {
        $permission = new Permission(['code' => $permissionCode]);
        $role = new Role(['name' => $roleName]);
        $role->setRelation('permissions', collect([$permission]));
        $user->setRelation('roles', collect([$role]));
        $user->setRelation('directPermissions', collect());
        $user->setRelation('adminProfile', null);
    }
}
