<?php
/**
 * Splitflix — Backend Entry Point
 * Compatível com PHP 8.0+
 */

define('BASE_PATH', __DIR__);
define('START_TIME', microtime(true));

// ── Tratamento de erros (mostrar em dev) ──────────────────────────
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

// ── Output buffering para evitar "headers already sent" ───────────
if (ob_get_level() === 0) ob_start();

// ── Bootstrap ─────────────────────────────────────────────────────
require_once BASE_PATH . '/config/app.php';
require_once BASE_PATH . '/config/database.php';
require_once BASE_PATH . '/helpers/Response.php';
require_once BASE_PATH . '/helpers/JWT.php';
require_once BASE_PATH . '/helpers/Sanitizer.php';
require_once BASE_PATH . '/middleware/CorsMiddleware.php';
require_once BASE_PATH . '/middleware/RateLimitMiddleware.php';
require_once BASE_PATH . '/middleware/AuthMiddleware.php';

// ── CORS ──────────────────────────────────────────────────────────
\Middleware\CorsMiddleware::handle();

// ── Rate Limit ────────────────────────────────────────────────────
\Middleware\RateLimitMiddleware::handle();

// ── Router ────────────────────────────────────────────────────────
require_once BASE_PATH . '/routes/api.php';
