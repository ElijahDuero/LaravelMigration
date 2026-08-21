<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notif_bots', function (Blueprint $table) {
            $table->id();
            $table->string('channel', 50)->default('telegram');
            $table->string('label', 150);
            $table->string('bot_token', 255);
            $table->string('chat_id', 100);
            $table->boolean('enabled')->default(true);
            $table->string('created_by', 100)->default('system');
            $table->dateTime('created_at');
            $table->dateTime('updated_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notif_bots');
    }
};
