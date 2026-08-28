<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Modules\Protocol\app\Events\DeliberationMeetingChanged;
use Modules\Protocol\app\Models\DeliberationMeetingItem;
use Modules\Protocol\app\Models\EvaluationForm;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\ProtocolReviewAssignment;
use Modules\Protocol\app\Models\ReviewerEvaluation;
use Modules\Protocol\app\Models\Topic;
use Modules\Protocol\app\Services\DeliberationMeetingService;
use Modules\User\app\Models\Course;
use Modules\User\app\Models\Organ;
use Modules\User\app\Models\Permission;
use Modules\User\app\Models\Role;
use Modules\User\app\Models\ScientificArea;
use Modules\User\app\Models\SecretaryProfile;
use Modules\User\app\Models\TeacherProfile;
use Modules\User\app\Models\User;
use Tests\TestCase;

class DeliberationMeetingFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_meeting_can_be_scheduled_before_reviews_and_closed_with_an_incomplete_reviewer(): void
    {
        Event::fake([DeliberationMeetingChanged::class]);
        Carbon::setTestNow('2026-08-28 08:00:00 UTC');

        [$secretary, $reviewer, $form] = $this->scenario();
        $service = app(DeliberationMeetingService::class);

        $queue = $service->queue($secretary);
        $this->assertCount(1, $queue);
        $this->assertSame(1, $queue->first()['reviewers'][0]['days_remaining']);
        $this->assertSame('not_reviewed', $queue->first()['reviewers'][0]['review_status']);

        $meeting = $service->create($secretary, [
            'scheduled_at' => '2026-08-29 10:00:00 UTC',
            'location' => 'Sala do Comité Científico',
            'notes' => 'Pauta de teste',
            'evaluation_form_ids' => [$form->id],
        ]);

        $this->assertSame(EvaluationForm::STATUS_PENDING_REVIEW, $form->fresh()->status);
        $this->assertSame('scheduled', $meeting->status);
        $this->assertCount(0, $service->queue($secretary));

        try {
            $service->create($secretary, [
                'scheduled_at' => '2026-08-30 10:00:00 UTC',
                'location' => 'Outra sala',
                'evaluation_form_ids' => [$form->id],
            ]);
            $this->fail('Uma ficha não pode pertencer a duas reuniões ativas.');
        } catch (HttpResponseException $exception) {
            $this->assertSame(409, $exception->getResponse()->getStatusCode());
        }

        $item = $meeting->items->first();
        try {
            $service->startItem($meeting, $item, $reviewer);
            $this->fail('A reunião não pode iniciar antes do horário marcado.');
        } catch (HttpResponseException $exception) {
            $this->assertSame(422, $exception->getResponse()->getStatusCode());
        }

        Carbon::setTestNow('2026-08-29 10:00:00 UTC');
        $meeting = $service->startItem($meeting, $item, $reviewer);
        $this->assertSame('in_progress', $meeting->status);
        $this->assertSame(EvaluationForm::STATUS_IN_DELIBERATION, $form->fresh()->status);

        $meeting = $service->closeItem(
            $meeting,
            $meeting->items->first(),
            $reviewer,
            DeliberationMeetingItem::STATUS_NOT_DELIBERATED
        );

        $this->assertSame('completed', $meeting->status);
        $this->assertSame(EvaluationForm::STATUS_NOT_DELIBERATED, $form->fresh()->status);
        $this->assertSame(2, $form->reviewerEvaluations()->where('status', ReviewerEvaluation::STATUS_PENDING)->count());
        $this->assertCount(1, $service->queue($secretary));
        $this->assertTrue(Carbon::parse($service->queue($secretary)->first()['queue_entered_at'])->equalTo(now()));
    }

    private function scenario(): array
    {
        $organ = Organ::create([
            'name' => 'Comité Científico',
            'type' => Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE,
            'description' => 'Teste',
        ]);
        $area = ScientificArea::create(['organ_id' => $organ->id, 'name' => 'Saúde Pública']);
        $course = Course::create(['scientific_area_id' => $area->id, 'name' => 'Medicina', 'code' => 'MED-T']);
        $student = $this->user('Estudante', 'estudante.deliberacao@example.test');
        $secretary = $this->user('Secretária', 'secretaria.deliberacao@example.test');
        $reviewerOne = $this->user('Revisor Um', 'revisor.um@example.test');
        $reviewerTwo = $this->user('Revisor Dois', 'revisor.dois@example.test');

        $secretaryProfile = new SecretaryProfile(['organ_id' => $organ->id, 'office' => 'Secretaria']);
        $secretaryProfile->setRelation('organ', $organ);
        $secretary->setRelation('secretaryProfile', $secretaryProfile);
        $this->withPermission($secretary, 'secretary', 'protocol.assign');

        $teacherOne = TeacherProfile::create([
            'user_id' => $reviewerOne->id,
            'scientific_area_id' => $area->id,
            'department' => 'Medicina',
            'academic_degree' => 'mestrado',
            'is_internal' => true,
        ]);
        $teacherTwo = TeacherProfile::create([
            'user_id' => $reviewerTwo->id,
            'scientific_area_id' => $area->id,
            'department' => 'Medicina',
            'academic_degree' => 'mestrado',
            'is_internal' => true,
        ]);
        $reviewerOne->setRelation('teacherProfile', $teacherOne);
        $reviewerTwo->setRelation('teacherProfile', $teacherTwo);
        $this->withPermission($reviewerOne, 'reviewer', 'protocol.evaluate');
        $this->withPermission($reviewerTwo, 'reviewer', 'protocol.evaluate');

        $topic = Topic::create([
            'student_id' => $student->id,
            'scientific_area_id' => $area->id,
            'course_id' => $course->id,
            'title' => 'Protocolo para teste de deliberação',
            'status' => Topic::STATUS_APPROVED_NUCLEO,
        ]);
        $protocol = Protocol::create([
            'student' => $student->id,
            'current_organ_id' => $organ->id,
            'code' => 'CC-DEL-001',
            'topic_id' => $topic->id,
            'approved_by_supervisor' => true,
            'protocol_type' => 'protocol',
            'submission_number' => 1,
            'status' => Protocol::STATUS_IN_REVIEW_COMITE_CIENTIFICO,
            'version' => 'CC_V1',
            'submitted_at' => now()->subDays(8),
        ]);
        $assignment = ProtocolReviewAssignment::create([
            'protocol_id' => $protocol->id,
            'organ_id' => $organ->id,
            'reviewer_one' => $teacherOne->id,
            'reviewer_two' => $teacherTwo->id,
            'is_primary' => false,
            'status' => 'pending',
            'assigned_at' => now()->subDays(6),
        ]);
        $form = EvaluationForm::create([
            'protocol_id' => $protocol->id,
            'version' => 'CC_V1',
            'form_type' => EvaluationForm::FORM_TYPE_EVALUATION,
            'organ' => Protocol::ORGAN_COMITE_CIENTIFICO,
            'status' => EvaluationForm::STATUS_PENDING_REVIEW,
        ]);
        foreach ([$teacherOne, $teacherTwo] as $teacher) {
            ReviewerEvaluation::create([
                'evaluation_form_id' => $form->id,
                'protocol_review_assignment_id' => $assignment->id,
                'reviewer_id' => $teacher->id,
                'status' => ReviewerEvaluation::STATUS_PENDING,
            ]);
        }

        return [$secretary, $reviewerOne, $form];
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
