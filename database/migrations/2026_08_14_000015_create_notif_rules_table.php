<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notif_rules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bot_id');
            $table->string('event_type', 100);
            $table->string('min_severity', 20)->nullable();
            $table->boolean('enabled')->default(true);
            $table->dateTime('created_at');

            $table->index('bot_id');
            $table->foreign('bot_id')->references('id')->on('notif_bots')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notif_rules');
    }
};
