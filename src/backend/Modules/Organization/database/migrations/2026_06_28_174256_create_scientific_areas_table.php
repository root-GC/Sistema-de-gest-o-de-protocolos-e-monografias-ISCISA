<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scientific_areas', function (Blueprint $table) {
            $table->id();

            $table->foreignId('organ_id')
                ->constrained('organs')
                ->restrictOnDelete();

            $table->string('name');
            // Saúde Pública | Reabilitação | Enfermagem

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scientific_areas');
    }
};