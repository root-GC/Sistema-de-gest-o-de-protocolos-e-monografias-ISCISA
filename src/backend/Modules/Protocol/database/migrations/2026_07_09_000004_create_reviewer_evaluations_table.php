<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviewer_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_form_id')->constrained('evaluation_forms')->cascadeOnDelete();
            $table->foreignId('protocol_review_assignment_id')->constrained('protocol_review_assignments')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('teacher_profiles')->cascadeOnDelete();
            $table->text('overall_comment')->nullable();
            $table->string('recommendation')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['evaluation_form_id', 'reviewer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviewer_evaluations');
    }
};
