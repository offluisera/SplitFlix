<?php
header('Content-Type: application/json');
echo json_encode([
    'status'     => 'ok',
    'php'        => PHP_VERSION,
    'extensions' => [
        'pdo'       => extension_loaded('pdo'),
        'pdo_mysql' => extension_loaded('pdo_mysql'),
        'json'      => extension_loaded('json'),
        'mbstring'  => extension_loaded('mbstring'),
        'curl'      => extension_loaded('curl'),
        'openssl'   => extension_loaded('openssl'),
    ],
    'base_path'  => __DIR__,
    'server'     => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
]);
