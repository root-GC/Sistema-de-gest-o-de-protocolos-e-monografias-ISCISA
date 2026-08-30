<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('protocol_review_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('protocol_id')->constrained('protocols')->cascadeOnDelete();
            $table->foreignId('document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('stage', 40)->default('supervisor')->index();
            $table->text('content');
            $table->timestamps();

            $table->index(['protocol_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('protocol_review_comments');
    }
};
