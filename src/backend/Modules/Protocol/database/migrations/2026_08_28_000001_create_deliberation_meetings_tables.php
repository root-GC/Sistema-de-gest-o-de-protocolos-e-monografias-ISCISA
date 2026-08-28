<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deliberation_meetings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organ_id')->constrained('organs')->cascadeOnDelete();
            $table->foreignId('scheduled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('scheduled_at')->index();
            $table->string('location', 500);
            $table->text('notes')->nullable();
            $table->string('status')->default('scheduled')->index();
            $table->dateTime('started_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->dateTime('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('cancellation_reason')->nullable();
            $table->timestamps();
        });

        Schema::create('deliberation_meeting_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained('deliberation_meetings')->cascadeOnDelete();
            $table->foreignId('evaluation_form_id')->constrained('evaluation_forms')->cascadeOnDelete();
            $table->dateTime('queue_entered_at')->index();
            $table->string('status')->default('scheduled')->index();
            $table->dateTime('started_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['meeting_id', 'evaluation_form_id']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
                CREATE UNIQUE INDEX deliberation_items_one_active_form
                ON deliberation_meeting_items (evaluation_form_id)
                WHERE status IN ('scheduled', 'in_progress')
            SQL);
        }

        $this->migrateLegacySchedules();
    }

    private function migrateLegacySchedules(): void
    {
        if (! Schema::hasColumn('evaluation_forms', 'deliberation_date')) {
            return;
        }

        $forms = DB::table('evaluation_forms')
            ->whereNull('evaluation_forms.deleted_at')
            ->whereNotNull('deliberation_date')
            ->whereIn('organ', ['comite_cientifico', 'comite_bioetica'])
            ->orderBy('deliberation_date')
            ->get();

        $organIds = DB::table('organs')
            ->whereNull('deleted_at')
            ->whereIn('type', ['scientific_committee', 'bioethics_committee'])
            ->pluck('id', 'type');

        $groups = $forms->groupBy(function ($form) use ($organIds) {
            $type = $form->organ === 'comite_cientifico'
                ? 'scientific_committee'
                : 'bioethics_committee';
            $organId = $organIds[$type] ?? null;

            return implode('|', [
                $organId,
                Carbon::parse($form->deliberation_date)->utc()->format('Y-m-d H:i:s'),
                $form->deliberation_location,
                $form->deliberation_scheduled_by,
            ]);
        });

        foreach ($groups as $group) {
            $first = $group->first();
            $type = $first->organ === 'comite_cientifico'
                ? 'scientific_committee'
                : 'bioethics_committee';
            $organId = $organIds[$type] ?? null;

            if (! $organId) {
                continue;
            }

            $meetingStatus = $group->contains(fn ($form) => $form->status === 'in_deliberation')
                ? 'in_progress'
                : ($group->every(fn ($form) => in_array($form->status, ['deliberated', 'concluded'], true))
                    ? 'completed'
                    : 'scheduled');
            $now = now();
            $meetingId = DB::table('deliberation_meetings')->insertGetId([
                'organ_id' => $organId,
                'scheduled_by' => $first->deliberation_scheduled_by,
                'scheduled_at' => Carbon::parse($first->deliberation_date)->utc(),
                'location' => $first->deliberation_location ?: 'Local não registado',
                'status' => $meetingStatus,
                'started_at' => $meetingStatus === 'in_progress' ? $now : null,
                'completed_at' => $meetingStatus === 'completed' ? $now : null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($group as $form) {
                $assignedAt = DB::table('reviewer_evaluations')
                    ->join('protocol_review_assignments', 'protocol_review_assignments.id', '=', 'reviewer_evaluations.protocol_review_assignment_id')
                    ->where('reviewer_evaluations.evaluation_form_id', $form->id)
                    ->whereNull('reviewer_evaluations.deleted_at')
                    ->min('protocol_review_assignments.assigned_at');
                $itemStatus = match ($form->status) {
                    'in_deliberation' => 'in_progress',
                    'deliberated', 'concluded' => 'deliberated',
                    'not_deliberated' => 'not_deliberated',
                    default => 'scheduled',
                };

                DB::table('deliberation_meeting_items')->insert([
                    'meeting_id' => $meetingId,
                    'evaluation_form_id' => $form->id,
                    'queue_entered_at' => $assignedAt ?: $form->created_at,
                    'status' => $itemStatus,
                    'started_at' => $itemStatus === 'in_progress' ? $now : null,
                    'completed_at' => in_array($itemStatus, ['deliberated', 'not_deliberated'], true) ? $now : null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                if ($form->status === 'deliberation_scheduled') {
                    $reviewStatuses = DB::table('reviewer_evaluations')
                        ->where('evaluation_form_id', $form->id)
                        ->whereNull('deleted_at')
                        ->pluck('status');
                    $normalisedStatus = $reviewStatuses->isNotEmpty() && $reviewStatuses->every(fn ($status) => $status === 'submitted')
                        ? 'deliberation_pending'
                        : ($reviewStatuses->contains(fn ($status) => in_array($status, ['in_progress', 'submitted'], true))
                            ? 'in_review'
                            : 'pending_review');

                    DB::table('evaluation_forms')->where('id', $form->id)->update([
                        'status' => $normalisedStatus,
                        'updated_at' => $now,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS deliberation_items_one_active_form');
        }

        Schema::dropIfExists('deliberation_meeting_items');
        Schema::dropIfExists('deliberation_meetings');
    }
};
