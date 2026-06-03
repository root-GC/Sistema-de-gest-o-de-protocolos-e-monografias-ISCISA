<?php
// 2024_01_02_000001_create_organs_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('organs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type');
            // nucleus | scientific_committee | bioethics_committee | scientific_direction
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void { Schema::dropIfExists('organs'); }
};