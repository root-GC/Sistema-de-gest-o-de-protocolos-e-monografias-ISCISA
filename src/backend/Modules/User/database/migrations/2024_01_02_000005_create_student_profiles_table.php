<?php
// 2024_01_02_000005_create_student_profiles_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
            // supervisorID aponta para teacher_profiles.id
            $table->unsignedBigInteger('supervisorID')->nullable();
            $table->foreign('supervisorID')->references('id')->on('teacher_profiles')->nullOnDelete();
            $table->string('student_number')->unique();
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void { Schema::dropIfExists('student_profiles'); }
};