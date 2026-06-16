<?php
/**
 * Splitflix — Sanitizador
 */

namespace Helpers;

class Sanitizer
{
    public static function string($value, $maxLen = 500)
    {
        if (!is_string($value)) $value = (string) $value;
        $value = trim($value);
        $value = strip_tags($value);
        $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        return mb_substr($value, 0, $maxLen);
    }

    public static function email($value)
    {
        $value = trim((string) $value);
        $value = filter_var($value, FILTER_SANITIZE_EMAIL);
        return filter_var($value, FILTER_VALIDATE_EMAIL) ? strtolower($value) : false;
    }

    public static function int($value, $min = PHP_INT_MIN, $max = PHP_INT_MAX)
    {
        $result = filter_var($value, FILTER_VALIDATE_INT, [
            'options' => ['min_range' => $min, 'max_range' => $max],
        ]);
        return $result !== false ? (int) $result : false;
    }

    public static function slug($value)
    {
        $value = mb_strtolower(trim($value));
        $from  = ['á','à','ã','â','ä','é','è','ê','ë','í','ì','î','ï','ó','ò','õ','ô','ö','ú','ù','û','ü','ç','ñ'];
        $to    = ['a','a','a','a','a','e','e','e','e','i','i','i','i','o','o','o','o','o','u','u','u','u','c','n'];
        $value = str_replace($from, $to, $value);
        $value = preg_replace('/[^a-z0-9\s-]/', '', $value);
        $value = preg_replace('/[\s-]+/', '-', $value);
        return trim($value, '-');
    }

    public static function adCode($html)
    {
        $html = str_replace("\0", '', $html);
        if (preg_match('/(document\.cookie|eval\s*\(|javascript\s*:)/i', $html)) {
            return '<!-- Código inválido -->';
        }
        return $html;
    }

    public static function url($value, $allowedHosts = [])
    {
        $value = trim((string) $value);
        $url   = filter_var($value, FILTER_VALIDATE_URL);
        if (!$url) return false;
        return $url;
    }

    public static function imdbId($value)
    {
        $value = trim((string) $value);
        return preg_match('/^tt\d{7,10}$/', $value) ? $value : false;
    }

    public static function jsonBody()
    {
        $raw = file_get_contents('php://input');
        if (empty($raw)) return [];
        $data = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE) return [];
        return is_array($data) ? $data : [];
    }

    public static function get($key, $default = null)
    {
        if (!isset($_GET[$key])) return $default;
        return self::string($_GET[$key]);
    }

    public static function getInt($key, $default = 0, $min = 0, $max = PHP_INT_MAX)
    {
        $val = self::int($_GET[$key] ?? $default, $min, $max);
        return $val !== false ? $val : $default;
    }
}
