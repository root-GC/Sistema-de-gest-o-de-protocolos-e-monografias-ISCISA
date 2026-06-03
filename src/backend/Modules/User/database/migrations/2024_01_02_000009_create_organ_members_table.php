<?php
// 2024_01_02_000009_create_organ_members_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('organ_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organ_id')->constrained('organs')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role');
            // cargo: reviewer | coordinator | president | member
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void { Schema::dropIfExists('organ_members'); }
};