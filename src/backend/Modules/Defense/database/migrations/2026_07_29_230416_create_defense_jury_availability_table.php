<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('defense_jury_availability', function (Blueprint $table) {
            $table->id();
            $table->foreignId('defense_jury_id')->constrained('defense_juries');
            $table->timestamp('proposed_at');
            $table->string('response')->default('pendente'); // pendente | aceite | recusado
            $table->timestamp('alternative_datetime')->nullable();
            $table->text('note')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('defense_jury_availability');
    }
};