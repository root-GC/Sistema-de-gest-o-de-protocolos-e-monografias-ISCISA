<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * admin_profiles
     *
     * access_scope:
     *   global — acesso a toda a instituição (super admin)
     *   organ  — acesso restrito a um órgão específico
     *
     * organ_id é null quando access_scope = 'global'.
     */
    public function up(): void
    {
        Schema::create('admin_profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('organ_id')
                ->nullable()
                ->constrained('organs')
                ->nullOnDelete();

            $table->string('access_scope')->default('global');
            // global | organ

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_profiles');
    }
};