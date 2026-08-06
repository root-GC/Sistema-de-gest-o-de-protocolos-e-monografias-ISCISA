<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('protocol_review_assignments', function (Blueprint $table) {
            $table->boolean('is_primary')->default(false)->after('review_order');
        });
    }

    public function down(): void
    {
        Schema::table('protocol_review_assignments', function (Blueprint $table) {
            $table->dropColumn('is_primary');
        });
    }
};
