<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notif_audit_config', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bot_id');
            $table->boolean('enabled')->default(true);
            $table->string('filter_module', 100)->default('');
            $table->string('filter_actor', 100)->default('');
            $table->string('filter_level', 20)->default('all');
            $table->string('created_by', 100)->default('system');
            $table->dateTime('updated_at');

            $table->foreign('bot_id')->references('id')->on('notif_bots')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notif_audit_config');
    }
};
