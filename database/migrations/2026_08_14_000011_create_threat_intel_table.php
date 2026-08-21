<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('threat_intel', function (Blueprint $table) {
            $table->id();
            $table->string('ioc_id', 30)->unique();
            $table->enum('type', ['Phishing Domain', 'Malicious IP', 'Blocked IP', 'IOC', 'Malware Hash', 'Suspicious URL']);
            $table->string('value', 500);
            $table->enum('severity', ['Low', 'Medium', 'High', 'Critical'])->default('Medium');
            $table->enum('status', ['Active', 'Inactive', 'Whitelisted'])->default('Active');
            $table->enum('confidence', ['Low', 'Medium', 'High'])->default('Medium');
            $table->string('source', 200)->nullable();
            $table->string('tags', 500)->nullable();
            $table->text('description')->nullable();
            $table->date('first_seen')->nullable();
            $table->date('last_seen')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('misp_event', 200)->nullable();
            $table->string('vt_permalink', 500)->nullable();
            $table->string('abuse_report', 500)->nullable();
            $table->string('created_by', 100)->default('system');
            $table->dateTime('created_at');
            $table->dateTime('updated_at');

            $table->index('type');
            $table->index('severity');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('threat_intel');
    }
};
