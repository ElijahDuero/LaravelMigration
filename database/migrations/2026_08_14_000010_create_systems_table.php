<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('systems', function (Blueprint $table) {
            $table->id();
            $table->string('sys_id', 30)->unique();
            $table->string('name', 200);
            $table->string('category', 100)->default('Other');
            $table->enum('status', ['Active', 'Maintenance', 'Development', 'Suspended', 'Decommissioned'])->default('Active');
            $table->text('description')->nullable();
            $table->string('url', 500)->nullable();
            $table->date('go_live_date')->nullable();
            $table->string('owner', 150);
            $table->string('vendor', 150)->nullable();
            $table->string('developer', 150)->nullable();
            $table->string('support_contact', 150)->nullable();
            $table->string('source_code_repo', 500)->nullable();
            $table->string('api_documentation', 500)->nullable();
            $table->string('hosting', 100)->nullable();
            $table->string('server', 150)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('database_type', 100)->nullable();
            $table->string('operating_system', 100)->nullable();
            $table->string('tech_stack', 255)->nullable();
            $table->enum('criticality', ['Critical', 'High', 'Medium', 'Low'])->default('Medium');
            $table->string('authentication', 150)->nullable();
            $table->string('backup', 150)->nullable();
            $table->text('recovery_plan')->nullable();
            $table->text('notes')->nullable();
            $table->string('branch', 100)->nullable();
            $table->string('created_by', 100)->default('system');
            $table->dateTime('created_at');
            $table->dateTime('updated_at');

            $table->index('category');
            $table->index('criticality');
            $table->index('status');
            $table->index('branch');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('systems');
    }
};
