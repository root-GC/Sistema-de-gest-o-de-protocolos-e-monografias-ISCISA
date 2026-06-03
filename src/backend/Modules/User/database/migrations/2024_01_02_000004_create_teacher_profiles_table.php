<?php
// 2024_01_02_000004_create_teacher_profiles_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('teacher_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('scientific_area_id')->nullable()->constrained('scientific_areas')->nullOnDelete();
            $table->string('department')->nullable();
            $table->string('academic_degree')->nullable();
            // licenciatura | mestrado | doutoramento
            $table->boolean('is_Internal')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void { Schema::dropIfExists('teacher_profiles'); }
};