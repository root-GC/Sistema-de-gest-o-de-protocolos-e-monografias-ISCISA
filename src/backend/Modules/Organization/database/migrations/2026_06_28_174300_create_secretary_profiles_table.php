<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * secretary_profiles
     *
     * Secretário pertence a um órgão específico.
     * A distinção administrativo/executivo é contextual ao órgão — mesmas permissões.
     */
    public function up(): void
    {
        Schema::create('secretary_profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('organ_id')
                ->constrained('organs')
                ->restrictOnDelete();

            $table->string('office')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('secretary_profiles');
    }
};