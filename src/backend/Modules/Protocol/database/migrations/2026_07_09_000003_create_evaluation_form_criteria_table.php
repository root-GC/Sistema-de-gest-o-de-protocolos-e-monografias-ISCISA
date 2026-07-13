<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluation_form_criteria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_form_id')->constrained('evaluation_forms')->cascadeOnDelete();
            $table->foreignId('criterion_id')->constrained('evaluation_criteria')->cascadeOnDelete();
            $table->string('group_name');
            $table->string('criterion_name');
            $table->unsignedInteger('order_column')->default(0);
            $table->timestamps();

            $table->unique(['evaluation_form_id', 'criterion_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_form_criteria');
    }
};
