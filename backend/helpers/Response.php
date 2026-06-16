<?php
/**
 * Splitflix — Helper de resposta JSON
 */

namespace Helpers;

class Response
{
    public static function success($data = null, $message = 'OK', $status = 200)
    {
        self::send([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $status);
    }

    public static function error($message, $status = 400, $errors = [])
    {
        $body = ['success' => false, 'message' => $message];
        if (!empty($errors)) $body['errors'] = $errors;
        self::send($body, $status);
    }

    public static function paginated($items, $total, $page, $perPage)
    {
        self::send([
            'success' => true,
            'data'    => $items,
            'meta'    => [
                'total'       => $total,
                'page'        => $page,
                'per_page'    => $perPage,
                'total_pages' => (int) ceil($total / max(1, $perPage)),
                'has_next'    => ($page * $perPage) < $total,
                'has_prev'    => $page > 1,
            ],
        ], 200);
    }

    public static function unauthorized($message = 'Não autorizado.')
    {
        self::error($message, 401);
    }

    public static function forbidden($message = 'Acesso negado.')
    {
        self::error($message, 403);
    }

    public static function notFound($message = 'Recurso não encontrado.')
    {
        self::error($message, 404);
    }

    public static function validationError($errors)
    {
        self::error('Erro de validação.', 422, $errors);
    }

    private static function send($body, $status)
    {
        if (ob_get_level()) ob_end_clean();

        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        header('Access-Control-Allow-Origin: *'); // fallback CORS

        if (defined('APP_DEBUG') && APP_DEBUG) {
            $body['_debug'] = ['time_ms' => round((microtime(true) - START_TIME) * 1000, 2)];
        }

        echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
