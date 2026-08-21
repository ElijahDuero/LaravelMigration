<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('audit_log', function (Blueprint $table) {
            $table->id();
            $table->string('actor', 100)->default('system');
            $table->string('role', 100)->default('');
            $table->string('module', 100)->default('system');
            $table->string('action', 255);
            $table->string('target', 255)->nullable();
            $table->text('detail')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->dateTime('created_at');

            $table->index('created_at');
            $table->index('module');
            $table->index('actor');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_log');
    }
};
