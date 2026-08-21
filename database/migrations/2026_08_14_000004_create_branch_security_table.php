<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('branch_security', function (Blueprint $table) {
            $table->id();
            $table->string('branch', 150)->unique();
            $table->unsignedInteger('computers_total')->default(0);
            $table->unsignedInteger('computers_online')->default(0);
            $table->unsignedInteger('computers_offline')->default(0);
            $table->unsignedInteger('computers_outdated')->default(0);
            $table->unsignedInteger('computers_patched')->default(0);
            $table->unsignedInteger('computers_encrypted')->default(0);
            $table->unsignedTinyInteger('antivirus')->default(0);
            $table->unsignedTinyInteger('firewall')->default(0);
            $table->unsignedTinyInteger('disk_encryption')->default(0);
            $table->unsignedTinyInteger('password_policy')->default(0);
            $table->unsignedTinyInteger('mfa')->default(0);
            $table->unsignedTinyInteger('backup_status')->default(0);
            $table->text('notes')->nullable();
            $table->string('updated_by', 100)->default('system');
            $table->dateTime('updated_at');

            $table->index('branch');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_security');
    }
};
