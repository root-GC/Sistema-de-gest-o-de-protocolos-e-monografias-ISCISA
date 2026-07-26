<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * teacher_profiles — usado por roles: teacher, supervisor, reviewer.
     *
     * Um mesmo user pode acumular teacher + supervisor + reviewer.
     * A distinção é pela role em user_roles, não por tabela separada.
     *
     * academic_degree é usado pelo sistema para validar elegibilidade
     * de revisores (RF-061): mestrado/doutoramento exige revisor >= mestre.
     *
     * is_internal distingue docentes internos de externos (convidados),
     * relevante para atribuição de júris e revisores.
     */
    public function up(): void
    {
        Schema::create('teacher_profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('scientific_area_id')
                ->nullable()
                ->constrained('scientific_areas')
                ->nullOnDelete();

            $table->string('department')->nullable();

            $table->string('academic_degree');
            // licenciatura | mestrado | doutoramento

            $table->boolean('is_internal')->default(true);

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_profiles');
    }
};