<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('opinions', function (Blueprint $table) {
            $table->string('signed_document_path')->nullable()->after('document_path');
            $table->string('signed_file_name')->nullable()->after('signed_document_path');
            $table->foreignId('signed_by')->nullable()->constrained('users')->nullOnDelete()->after('signed_file_name');
            $table->timestamp('signed_at')->nullable()->after('signed_by');
        });
    }

    public function down(): void
    {
        Schema::table('opinions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('signed_by');
            $table->dropColumn(['signed_document_path', 'signed_file_name', 'signed_at']);
        });
    }
};
