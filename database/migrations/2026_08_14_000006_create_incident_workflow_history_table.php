<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('incident_workflow_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('incident_id');
            $table->enum('status', [
                'draft', 'reported', 'assigned', 'investigation',
                'containment', 'eradication', 'recovery', 'lessons', 'closed',
            ]);
            $table->string('action', 255);
            $table->string('actor', 100);
            $table->text('notes')->nullable();
            $table->dateTime('created_at');

            $table->index(['incident_id', 'created_at']);
            $table->foreign('incident_id')->references('id')->on('incidents')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incident_workflow_history');
    }
};
