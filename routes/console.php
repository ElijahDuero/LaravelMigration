<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('db:fix-schema', function () {
    $db = \Illuminate\Support\Facades\DB::connection()->getDatabaseName();
    $this->info("Connected to database: {$db}");

    $cols = \Illuminate\Support\Facades\DB::select("SHOW COLUMNS FROM threat_intel");
    $names = array_column($cols, 'Field');
    $this->info("threat_intel columns: " . implode(', ', $names));

    if (!in_array('is_sample', $names)) {
        $this->warn("is_sample column is MISSING! Adding column now...");
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE threat_intel ADD COLUMN is_sample TINYINT(1) NOT NULL DEFAULT 0 AFTER expiry_date");
        $this->info("Column is_sample added successfully.");
    } else {
        $this->info("is_sample column ALREADY EXISTS.");
    }
})->purpose('Ensure threat_intel schema has is_sample');
