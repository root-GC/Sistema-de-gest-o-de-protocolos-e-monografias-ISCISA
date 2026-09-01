<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_revisions', function (Blueprint $table) {
            $table->id();
            $table->string('documentable_type', 120);
            $table->unsignedBigInteger('documentable_id');
            $table->string('source_table', 80)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->unsignedInteger('submission_number')->nullable();
            $table->unsignedInteger('revision_number')->default(1);
            $table->string('document_key', 120)->nullable();
            $table->string('file_name');
            $table->string('storage_disk', 80)->default('public');
            $table->string('file_path', 1000)->nullable();
            $table->string('mime_type', 160)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('sha256', 64)->nullable();
            $table->string('availability', 24)->default('available');
            $table->foreignId('captured_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('organ_id')->nullable()->constrained('organs')->nullOnDelete();
            $table->foreignId('parent_revision_id')->nullable()->constrained('document_revisions')->nullOnDelete();
            $table->timestamp('captured_at')->nullable();
            $table->timestamps();

            $table->index(['documentable_type', 'documentable_id', 'submission_number'], 'document_revision_subject_index');
            $table->index(['source_table', 'source_id'], 'document_revision_source_index');
            $table->index(['availability', 'captured_at'], 'document_revision_availability_index');
            $table->unique(['source_table', 'source_id', 'revision_number'], 'document_revision_source_unique');
        });

        Schema::create('workflow_events', function (Blueprint $table) {
            $table->id();
            $table->uuid('event_key')->nullable()->unique();
            $table->string('source_table', 80)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->string('subject_type', 120);
            $table->unsignedBigInteger('subject_id');
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('organ_id')->nullable()->constrained('organs')->nullOnDelete();
            $table->foreignId('document_revision_id')->nullable()->constrained('document_revisions')->nullOnDelete();
            $table->string('action', 100);
            $table->string('from_state', 100)->nullable();
            $table->string('to_state', 100)->nullable();
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index(['subject_type', 'subject_id', 'occurred_at'], 'workflow_event_subject_index');
            $table->unique(['source_table', 'source_id'], 'workflow_event_source_unique');
            $table->index(['organ_id', 'occurred_at'], 'workflow_event_organ_index');
            $table->index(['action', 'occurred_at'], 'workflow_event_action_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_events');
        Schema::dropIfExists('document_revisions');
    }
};
