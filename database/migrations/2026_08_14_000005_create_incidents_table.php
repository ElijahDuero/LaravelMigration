<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->string('incident_number', 30)->unique();
            $table->dateTime('incident_at')->nullable();
            $table->dateTime('reported_at')->nullable();
            $table->string('branch', 100)->nullable();
            $table->string('campus', 100)->nullable();
            $table->string('department', 100)->nullable();
            $table->string('reporter_name', 150)->nullable();
            $table->string('contact_number', 50)->nullable();
            $table->enum('severity', ['Low', 'Medium', 'High', 'Critical'])->nullable();
            $table->string('category', 100)->nullable();
            $table->text('description')->nullable();
            $table->text('systems_affected')->nullable();
            $table->unsignedInteger('users_affected')->default(0);
            $table->string('ip_address', 45)->nullable();
            $table->string('hostname', 150)->nullable();
            $table->string('device', 150)->nullable();
            $table->string('browser', 150)->nullable();
            $table->string('operating_system', 100)->nullable();
            $table->enum('workflow_status', [
                'draft', 'reported', 'assigned', 'investigation',
                'containment', 'eradication', 'recovery', 'lessons', 'closed',
            ])->default('reported');
            $table->string('assigned_to', 150)->nullable();
            $table->boolean('is_sample')->default(false);
            $table->string('created_by', 100);
            $table->dateTime('created_at');
            $table->dateTime('updated_at');

            $table->index('branch');
            $table->index('workflow_status');
            $table->index('is_sample');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};
