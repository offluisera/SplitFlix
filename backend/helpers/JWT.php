<?php
/**
 * Splitflix — JWT Helper
 */

namespace Helpers;

class JWT
{
    public static function generate($payload)
    {
        $header = self::base64url(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));

        $payload['iat'] = time();
        $payload['exp'] = time() + (JWT_EXPIRY_MINUTES * 60);
        $payload['iss'] = APP_URL;

        $body = self::base64url(json_encode($payload));
        $sig  = self::base64url(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));

        return "$header.$body.$sig";
    }

    public static function verify($token)
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new \Exception('Token malformado.');
        }

        [$header, $body, $signature] = $parts;

        $expected = self::base64url(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
        if (!hash_equals($expected, $signature)) {
            throw new \Exception('Assinatura inválida.');
        }

        $payload = json_decode(self::base64urlDecode($body), true);
        if (!$payload) throw new \Exception('Payload inválido.');

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new \Exception('Token expirado.');
        }

        return $payload;
    }

    public static function generateRefreshToken()
    {
        return bin2hex(random_bytes(48));
    }

    public static function hashRefreshToken($token)
    {
        return hash('sha256', $token);
    }

    private static function base64url($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64urlDecode($data)
    {
        $pad  = strlen($data) % 4;
        if ($pad) $data .= str_repeat('=', 4 - $pad);
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
