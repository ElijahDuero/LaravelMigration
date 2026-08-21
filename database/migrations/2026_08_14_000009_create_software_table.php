<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('software', function (Blueprint $table) {
            $table->id();
            $table->string('sw_id', 30)->unique();
            $table->string('name', 200);
            $table->string('category', 100);
            $table->string('vendor', 150)->nullable();
            $table->string('version', 100)->nullable();
            $table->string('license_type', 50)->default('Licensed');
            $table->string('license_model', 100)->nullable();
            $table->string('license_key', 255)->nullable();
            $table->unsignedInteger('total_licenses')->default(1);
            $table->unsignedInteger('used_licenses')->default(0);
            $table->string('branch', 100)->nullable();
            $table->string('department', 100)->nullable();
            $table->date('purchase_date')->nullable();
            $table->string('expiry_date', 50)->nullable();
            $table->decimal('cost_annual', 12, 2)->nullable();
            $table->string('supplier', 150)->nullable();
            $table->string('po_number', 100)->nullable();
            $table->string('invoice', 100)->nullable();
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
        Schema::dropIfExists('software');
    }
};
