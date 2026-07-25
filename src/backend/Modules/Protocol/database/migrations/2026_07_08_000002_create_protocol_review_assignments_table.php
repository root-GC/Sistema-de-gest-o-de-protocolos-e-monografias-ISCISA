<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('protocol_review_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('protocol_id')->constrained('protocols')->cascadeOnDelete();
            $table->foreignId('organ_id')->constrained('organs')->cascadeOnDelete();
            $table->foreignId('reviewer_one')->nullable()->constrained('teacher_profiles')->nullOnDelete();
            $table->foreignId('reviewer_two')->nullable()->constrained('teacher_profiles')->nullOnDelete();
            $table->boolean('review_order')->default(false);
            $table->string('status')->default('pending');
            $table->timestamp('assigned_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('protocol_review_assignments');
    }
};
