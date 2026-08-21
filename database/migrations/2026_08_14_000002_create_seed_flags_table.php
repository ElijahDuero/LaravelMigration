<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('seed_flags', function (Blueprint $table) {
            $table->string('flag', 100)->primary();
            $table->dateTime('seeded_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seed_flags');
    }
};
