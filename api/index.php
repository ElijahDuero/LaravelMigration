<?php

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

// DIAGNOSTIC: dump request info for POST to /login only
if ($_SERVER['REQUEST_METHOD'] === 'POST' && strpos($_SERVER['REQUEST_URI'] ?? '', 'login') !== false) {
    error_log('[DIAG] POST /login reached PHP. URI=' . ($_SERVER['REQUEST_URI'] ?? 'unknown'));
    error_log('[DIAG] CONTENT_TYPE=' . ($_SERVER['CONTENT_TYPE'] ?? 'none'));
    error_log('[DIAG] CONTENT_LENGTH=' . ($_SERVER['CONTENT_LENGTH'] ?? 'none'));
    error_log('[DIAG] Cookie count=' . count($_COOKIE));
}

$tmpDirs = [
    '/tmp/storage/app/public',
    '/tmp/storage/framework/cache/data',
    '/tmp/storage/framework/views',
    '/tmp/storage/framework/sessions',
    '/tmp/storage/framework/testing',
    '/tmp/storage/logs',
    '/tmp/bootstrap/cache'
];

foreach ($tmpDirs as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
}

require __DIR__ . '/../public/index.php';

