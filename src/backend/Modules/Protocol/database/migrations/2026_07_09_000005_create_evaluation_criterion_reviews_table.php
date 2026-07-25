<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluation_criterion_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reviewer_evaluation_id')->constrained('reviewer_evaluations')->cascadeOnDelete();
            $table->foreignId('evaluation_form_criterion_id')->constrained('evaluation_form_criteria')->cascadeOnDelete();
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['reviewer_evaluation_id', 'evaluation_form_criterion_id'], 'criterion_review_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_criterion_reviews');
    }
};
