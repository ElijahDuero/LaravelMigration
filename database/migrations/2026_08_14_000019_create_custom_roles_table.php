<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('custom_roles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('description', 500)->default('');
            $table->string('color', 10)->default('6b7280');
            $table->string('icon', 50)->default('fa-user-tag');
            $table->text('permissions');
            $table->dateTime('created_at');
            $table->dateTime('updated_at');

            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_roles');
    }
};
