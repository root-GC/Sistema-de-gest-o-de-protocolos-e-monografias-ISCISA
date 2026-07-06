<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * topic_review_assignments — atribuição de avaliadores a temas pelo Núcleo.
     *
     * Quando a secretaria do Núcleo aloca um avaliador a um tema:
     *   - topic_id → tópico já aprovado pelo supervisor
     *   - reviewer_id → teacher_profile.id do avaliador (deve ser do mesmo núcleo)
     *   - assigned_at → timestamp da alocação
     *   - assigned_by_id → user_id da secretaria que fez a alocação
     *
     * Índice único em (topic_id, reviewer_id) para evitar alocação duplicada
     * do mesmo revisor ao mesmo tema.
     *
     * Constraint: reviewer_id deve estar em teacher_profiles.id e ser de um docente
     * do mesmo núcleo que o tema (via scientific_area.organ_id).
     */
    public function up(): void
    {
        Schema::create('topic_review_assignments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('topic_id')
                ->constrained('topics')
                ->cascadeOnDelete();

            $table->foreignId('reviewer_id')
                ->constrained('teacher_profiles')
                ->cascadeOnDelete();

            $table->foreignId('assigned_by_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->timestamp('assigned_at')->useCurrent();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['topic_id', 'reviewer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('topic_review_assignments');
    }
};
