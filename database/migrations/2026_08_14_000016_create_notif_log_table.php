<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notif_log', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bot_id')->nullable();
            $table->string('channel', 50)->default('telegram');
            $table->string('event_type', 100);
            $table->text('message');
            $table->enum('status', ['sent', 'failed', 'pending'])->default('sent');
            $table->text('error')->nullable();
            $table->dateTime('sent_at');

            $table->index('sent_at');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notif_log');
    }
};
