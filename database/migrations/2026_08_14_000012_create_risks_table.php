<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('risks', function (Blueprint $table) {
            $table->id();
            $table->string('risk_id', 20)->unique();
            $table->string('title', 300);
            $table->enum('category', ['Operational', 'Technical', 'Financial', 'Compliance', 'Human'])->default('Operational');
            $table->enum('level', ['Critical', 'High', 'Medium', 'Low'])->default('Medium');
            $table->unsignedTinyInteger('score')->default(1);
            $table->enum('likelihood', ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'])->default('Possible');
            $table->enum('impact', ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'])->default('Moderate');
            $table->enum('status', ['Open', 'Mitigating', 'Mitigated'])->default('Open');
            $table->string('owner', 150)->nullable();
            $table->string('branch', 150)->nullable();
            $table->date('due_date')->nullable();
            $table->text('mitigation')->nullable();
            $table->string('created_by', 100)->default('system');
            $table->dateTime('created_at');
            $table->dateTime('updated_at');

            $table->index('status');
            $table->index('level');
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('risks');
    }
};
