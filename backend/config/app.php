<?php
/**
 * Splitflix — Configurações globais
 * Compatível com PHP 8.0+
 */

// ── Ambiente ──────────────────────────────────────────────────────
define('APP_ENV',     'development');
define('APP_DEBUG',   true);
define('APP_NAME',    'Splitflix');
define('APP_VERSION', '1.0.0');

// URL base do backend - ajuste conforme seu XAMPP
define('APP_URL', 'http://localhost/splitflix/backend');

// ── JWT ───────────────────────────────────────────────────────────
define('JWT_SECRET',         'splitflix_secret_key_troque_em_producao_2026_xYzAbc123');
define('JWT_EXPIRY_MINUTES', 60);
define('JWT_REFRESH_DAYS',   30);

// ── CORS ──────────────────────────────────────────────────────────
define('CORS_ALLOWED_ORIGINS', [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://localhost',
]);

// ── Rate Limiting ─────────────────────────────────────────────────
define('RATE_LIMIT_REQUESTS', 200);  // aumentado para dev
define('RATE_LIMIT_WINDOW',   60);
define('LOGIN_MAX_ATTEMPTS',  10);   // mais permissivo em dev
define('LOGIN_BLOCK_MINUTES', 5);

// ── Upload ────────────────────────────────────────────────────────
define('UPLOAD_MAX_MB',        10);
define('UPLOAD_ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/webp']);
define('UPLOAD_PATH',          BASE_PATH . '/uploads/');

// ── Paginação ─────────────────────────────────────────────────────
define('DEFAULT_PAGE_SIZE', 20);
define('MAX_PAGE_SIZE',     100);

// ── Timezone ──────────────────────────────────────────────────────
date_default_timezone_set('America/Sao_Paulo');

// ── PHP settings ─────────────────────────────────────────────────
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(0);
    ini_set('display_errors', '0');
}
