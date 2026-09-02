<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organ_document_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organ_id')->constrained('organs')->cascadeOnDelete();
            $table->string('document_key', 100);
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->boolean('is_optional')->default(false);
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['organ_id', 'document_key'], 'organ_document_requirement_key_unique');
            $table->index(['organ_id', 'is_active'], 'organ_document_requirement_active_idx');
        });

        Schema::create('organ_document_requirement_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organ_document_requirement_id')->constrained('organ_document_requirements')->cascadeOnDelete();
            $table->foreignId('organ_id')->constrained('organs')->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 60);
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index(['organ_id', 'occurred_at'], 'organ_document_requirement_event_idx');
        });

        Schema::table('protocol_document_requirements', function (Blueprint $table) {
            $table->foreignId('organ_document_requirement_id')
                ->nullable()
                ->after('protocol_id')
                ->constrained('organ_document_requirements')
                ->nullOnDelete();
            $table->text('description')->nullable()->after('nome');
        });
    }

    public function down(): void
    {
        Schema::table('protocol_document_requirements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('organ_document_requirement_id');
            $table->dropColumn('description');
        });

        Schema::dropIfExists('organ_document_requirement_events');
        Schema::dropIfExists('organ_document_requirements');
    }
};
