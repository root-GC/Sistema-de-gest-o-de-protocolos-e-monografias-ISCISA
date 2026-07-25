<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('topic_review_evaluations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('topic_id')
                ->constrained('topics')
                ->cascadeOnDelete();

            $table->foreignId('assignment_id')
                ->constrained('topic_review_assignments')
                ->cascadeOnDelete()
                ->unique();

            $table->foreignId('reviewer_id')
                ->constrained('teacher_profiles')
                ->cascadeOnDelete();

            $table->string('decision');
            $table->text('comments')->nullable();
            $table->timestamp('evaluated_at')->useCurrent();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['topic_id', 'reviewer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('topic_review_evaluations');
    }
};
