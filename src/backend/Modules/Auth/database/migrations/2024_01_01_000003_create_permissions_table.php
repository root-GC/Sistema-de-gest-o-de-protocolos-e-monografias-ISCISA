<?php
// 2024_01_01_000003_create_permissions_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            // Domínios: topic.* | protocol.* | document.* | evaluation.*
            //           supervision.* | reviewer.* | workload.* | defense.*
            //           monograph.* | reports.* | admin.*
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void { Schema::dropIfExists('permissions'); }
};