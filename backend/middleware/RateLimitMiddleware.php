<?php
/**
 * Splitflix — Rate Limit Middleware (file-based, sem APCu)
 */

namespace Middleware;

use Helpers\Response;

class RateLimitMiddleware
{
    public static function handle()
    {
        // Em desenvolvimento, rate limit mais permissivo
        if (APP_DEBUG) return;

        $ip  = self::getClientIp();
        $key = 'ratelimit_' . md5($ip);
        $data = self::get($key) ?? ['count' => 0, 'reset' => time() + RATE_LIMIT_WINDOW];

        if (time() > $data['reset']) {
            $data = ['count' => 0, 'reset' => time() + RATE_LIMIT_WINDOW];
        }

        $data['count']++;
        self::set($key, $data, RATE_LIMIT_WINDOW);

        if ($data['count'] > RATE_LIMIT_REQUESTS) {
            Response::error('Muitas requisições. Tente novamente em instantes.', 429);
        }
    }

    public static function checkLoginAttempts($email, $ip)
    {
        if (APP_DEBUG) return; // Sem bloqueio em dev
        $key  = 'login_' . md5($email . $ip);
        $data = self::get($key) ?? ['count' => 0, 'blocked_until' => 0];
        if (time() < $data['blocked_until']) {
            $wait = ceil(($data['blocked_until'] - time()) / 60);
            Response::error("Conta bloqueada. Aguarde {$wait} minuto(s).", 429);
        }
    }

    public static function incrementLoginAttempts($email, $ip)
    {
        $key  = 'login_' . md5($email . $ip);
        $data = self::get($key) ?? ['count' => 0, 'blocked_until' => 0];
        $data['count']++;
        if ($data['count'] >= LOGIN_MAX_ATTEMPTS) {
            $data['blocked_until'] = time() + (LOGIN_BLOCK_MINUTES * 60);
            $data['count'] = 0;
        }
        self::set($key, $data, LOGIN_BLOCK_MINUTES * 60);
    }

    public static function clearLoginAttempts($email, $ip)
    {
        @unlink(sys_get_temp_dir() . '/sf_login_' . md5($email . $ip));
    }

    private static function get($key)
    {
        $file = sys_get_temp_dir() . '/sf_' . $key;
        if (!file_exists($file)) return null;
        $raw = @file_get_contents($file);
        if (!$raw) return null;
        $data = @unserialize($raw);
        if (!is_array($data) || !isset($data['exp']) || $data['exp'] < time()) {
            @unlink($file);
            return null;
        }
        return $data['val'];
    }

    private static function set($key, $value, $ttl)
    {
        $file = sys_get_temp_dir() . '/sf_' . $key;
        @file_put_contents($file, serialize(['exp' => time() + $ttl, 'val' => $value]), LOCK_EX);
    }

    public static function getClientIp()
    {
        foreach (['HTTP_CF_CONNECTING_IP','HTTP_X_REAL_IP','HTTP_X_FORWARDED_FOR','REMOTE_ADDR'] as $h) {
            if (!empty($_SERVER[$h])) {
                $ip = trim(explode(',', $_SERVER[$h])[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
            }
        }
        return '0.0.0.0';
    }
}
