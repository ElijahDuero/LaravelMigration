<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('threat_intel', function (Blueprint $table) {
            $table->boolean('is_sample')->default(false)->after('expiry_date');
            $table->index('is_sample');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('threat_intel', function (Blueprint $table) {
            $table->dropIndex(['is_sample']);
            $table->dropColumn('is_sample');
        });
    }
};
