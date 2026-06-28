<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * organ_members — membros formais de cada órgão.
     *
     * Um docente pode ser membro de múltiplos órgãos com cargos diferentes.
     * role aqui é o CARGO no órgão (president, member, reviewer, coordinator)
     * — diferente das roles de acesso em user_roles.
     *
     * Índice único em (organ_id, user_id) evita duplicação de membro
     * no mesmo órgão — um user pode ser president de um e member de outro.
     */
    public function up(): void
    {
        Schema::create('organ_members', function (Blueprint $table) {
            $table->id();

            $table->foreignId('organ_id')
                ->constrained('organs')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('role');
            // president | coordinator | reviewer | member

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['organ_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organ_members');
    }
};