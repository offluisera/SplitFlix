<?php
/**
 * Splitflix — Auth Middleware
 */

namespace Middleware;

use Helpers\JWT;
use Helpers\Response;

class AuthMiddleware
{
    private static $currentUser = null;

    public static function require()
    {
        $payload = self::attempt();
        if (!$payload) {
            Response::unauthorized('Token inválido ou expirado. Faça login novamente.');
        }
        return $payload;
    }

    public static function requireAdmin()
    {
        $user = self::require();
        if (!in_array($user['papel'], ['admin', 'moderador'], true)) {
            Response::forbidden('Você não tem permissão para acessar este recurso.');
        }
        return $user;
    }

    public static function requireSuperAdmin()
    {
        $user = self::require();
        if ($user['papel'] !== 'admin') {
            Response::forbidden('Acesso exclusivo para administradores.');
        }
        return $user;
    }

    public static function attempt()
    {
        if (self::$currentUser !== null) return self::$currentUser;

        $token = self::extractToken();
        if (!$token) return null;

        try {
            $payload = JWT::verify($token);
            if (empty($payload['sub']) || empty($payload['papel'])) return null;
            self::$currentUser = $payload;
            return $payload;
        } catch (\Exception $e) {
            return null;
        }
    }

    private static function extractToken()
    {
        // Tenta via $_SERVER primeiro
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $header = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (function_exists('getallheaders')) {
            $headers = getallheaders();
            $header  = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        } else {
            $header = '';
        }

        if ($header && preg_match('/^Bearer\s+(.+)$/i', trim($header), $m)) {
            return $m[1];
        }
        return null;
    }
}
