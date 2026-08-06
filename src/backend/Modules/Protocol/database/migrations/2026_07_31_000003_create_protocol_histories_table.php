<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('protocol_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('protocol_id')->constrained('protocols')->cascadeOnDelete();
            $table->foreignId('organ_id')->nullable()->constrained('organs')->nullOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 80);
            $table->text('description')->nullable();
            $table->string('old_status')->nullable();
            $table->string('new_status')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index(['protocol_id', 'occurred_at']);
            $table->index(['organ_id', 'occurred_at']);
            $table->index(['action', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('protocol_histories');
    }
};
