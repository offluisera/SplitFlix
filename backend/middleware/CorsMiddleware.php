<?php
/**
 * Splitflix — CORS Middleware
 */

namespace Middleware;

class CorsMiddleware
{
    public static function handle()
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if (in_array($origin, CORS_ALLOWED_ORIGINS, true)) {
            header("Access-Control-Allow-Origin: $origin");
        } else {
            // Dev: permite localhost sem porta específica
            if (APP_DEBUG && (strpos($origin, 'localhost') !== false || strpos($origin, '127.0.0.1') !== false)) {
                header("Access-Control-Allow-Origin: $origin");
            }
        }

        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Max-Age: 86400');
        header('Vary: Origin');
        header('Content-Type: application/json; charset=UTF-8');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
