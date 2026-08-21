<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_directory', function (Blueprint $table) {
            $table->id();
            $table->string('username', 100)->nullable()->unique();
            $table->string('name', 150);
            $table->string('email', 200)->unique();
            $table->string('role', 100)->default('Unassigned');
            $table->string('branch', 150)->default('');
            $table->string('dept', 100)->default('');
            $table->string('title', 150)->default('');
            $table->enum('status', ['Active', 'Inactive', 'Locked', 'Invited'])->default('Active');
            $table->boolean('mfa')->default(false);
            $table->string('avatar_bg', 10)->default('6b7280');
            $table->string('last_seen', 50)->default('-');
            $table->dateTime('created_at');
            $table->dateTime('updated_at');

            $table->index('role');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_directory');
    }
};
