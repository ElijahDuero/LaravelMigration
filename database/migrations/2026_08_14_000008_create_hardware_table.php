<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hardware', function (Blueprint $table) {
            $table->id();
            $table->string('tag', 30)->unique();
            $table->string('name', 150);
            $table->string('type', 50);
            $table->string('serial', 100)->nullable();
            $table->string('manufacturer', 100)->nullable();
            $table->string('model', 150)->nullable();
            $table->string('status', 50)->default('Active');
            $table->string('branch', 100)->nullable();
            $table->string('building', 100)->nullable();
            $table->string('room', 100)->nullable();
            $table->string('rack', 100)->nullable();
            $table->string('assigned_user', 150)->nullable();
            $table->string('department', 100)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('mac_address', 20)->nullable();
            $table->string('hostname', 150)->nullable();
            $table->string('operating_system', 100)->nullable();
            $table->string('cpu', 150)->nullable();
            $table->string('ram', 50)->nullable();
            $table->string('storage', 100)->nullable();
            $table->date('purchase_date')->nullable();
            $table->date('warranty_expiry')->nullable();
            $table->string('supplier', 150)->nullable();
            $table->string('invoice', 100)->nullable();
            $table->decimal('purchase_cost', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_sample')->default(false);
            $table->string('created_by', 100)->default('system');
            $table->dateTime('created_at');
            $table->dateTime('updated_at');

            $table->index('branch');
            $table->index('is_sample');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hardware');
    }
};
