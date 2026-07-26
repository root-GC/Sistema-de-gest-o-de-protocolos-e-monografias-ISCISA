<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('secretary_profiles', function (Blueprint $table) {
            $table->foreignId('scientific_area_id')
                ->nullable()
                ->after('organ_id')
                ->constrained('scientific_areas')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('secretary_profiles', function (Blueprint $table) {
            $table->dropForeign(['scientific_area_id']);
            $table->dropColumn('scientific_area_id');
        });
    }
};
