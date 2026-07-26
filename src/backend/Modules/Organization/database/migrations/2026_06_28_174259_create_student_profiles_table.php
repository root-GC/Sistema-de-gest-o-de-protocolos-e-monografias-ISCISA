<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * student_profiles
     *
     * supervisorID → teacher_profiles.id (não users.id).
     * Supervisor pode ser null temporariamente (estudante sem supervisor atribuído).
     * O curso determina a área científica e o órgão responsável pelos protocolos.
     */
    public function up(): void
    {
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('course_id')
                ->constrained('courses')
                ->restrictOnDelete();

            $table->foreignId('supervisor_id')
                ->nullable()
                ->constrained('teacher_profiles')
                ->nullOnDelete();

            $table->string('student_number')->unique();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_profiles');
    }
};