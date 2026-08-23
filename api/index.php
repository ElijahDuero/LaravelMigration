<?php

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

// Catch fatal PHP errors that kill the process silently
register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
        error_log('[FATAL] type=' . $error['type'] . ' msg=' . $error['message'] . ' file=' . $error['file'] . ':' . $error['line']);
    }
});

// Quick bypass test: respond to POST /login directly to confirm vercel-php handles POST OK
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && strpos($_SERVER['REQUEST_URI'] ?? '', 'login') !== false) {
    error_log('[DIAG] POST /login reached PHP — about to load Laravel');
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

