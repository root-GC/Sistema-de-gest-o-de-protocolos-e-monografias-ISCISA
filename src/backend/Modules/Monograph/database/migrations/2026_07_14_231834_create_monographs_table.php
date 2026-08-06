// Modules/Monograph/database/migrations/xxxx_create_monographs_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monographs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('protocol_id')->constrained('protocols');
            $table->foreignId('student_id')->constrained('users');
            $table->foreignId('supervisor_id')->constrained('teacher_profiles');
            $table->string('code')->unique();
            $table->string('title');
            $table->string('status')->default('aguarda_submissao');
            $table->timestamp('supervisor_endorsed_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monographs');
    }
};