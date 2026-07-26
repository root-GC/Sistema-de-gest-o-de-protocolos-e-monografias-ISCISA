<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * coordinator_profiles
     *
     * Um coordenador pertence a uma área científica e gere um curso específico.
     * Pode também ser docente (teacher_profiles) — roles acumulam-se.
     */
    public function up(): void
    {
        Schema::create('coordinator_profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('scientific_area_id')
                ->constrained('scientific_areas')
                ->restrictOnDelete();

            $table->foreignId('course_id')
                ->constrained('courses')
                ->restrictOnDelete();

            $table->string('office')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coordinator_profiles');
    }
};