<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name', 150)->unique();
            $table->string('location', 200);
            $table->enum('type', ['HQ', 'Satellite', 'Remote', 'Data Center'])->default('Satellite');
            $table->enum('status', ['Active', 'Planned', 'Inactive'])->default('Active');
            $table->string('head', 150)->nullable();
            $table->string('contact', 50)->nullable();
            $table->string('email', 150)->nullable();
            $table->unsignedInteger('employees')->default(0);
            $table->unsignedInteger('campuses')->default(1);
            $table->date('established')->nullable();
            $table->text('notes')->nullable();
            $table->string('created_by', 100)->default('system');
            $table->dateTime('created_at');
            $table->dateTime('updated_at');

            $table->index('status');
            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
