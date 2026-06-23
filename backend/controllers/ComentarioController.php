<?php
/**
 * Splitflix — ComentarioController (v2)
 *
 * Mudanças em relação à v1:
 *  - Campo `nota` (0–10) adicionado, obrigatório no store()
 *  - Admin e moderador podem deletar qualquer comentário
 *  - adminDestroy() dedicado para o painel de moderação
 */

require_once BASE_PATH . '/models/ComentarioModel.php';
use Helpers\Response;
use Helpers\Sanitizer;
use Middleware\AuthMiddleware;
use Middleware\RateLimitMiddleware;

class ComentarioController
{
    // GET /comentarios/{tipo}/{id}
    public static function index(string $tipo, string $id)
    {
        $allowed = ['filme', 'serie', 'anime', 'episodio'];
        if (!in_array($tipo, $allowed, true)) Response::error('Tipo inválido.', 400);

        $page    = Sanitizer::getInt('page', 1, 1);
        $perPage = Sanitizer::getInt('per_page', 20, 1, 50);
        $result  = (new ComentarioModel())->byConteudo($tipo, (int)$id, $page, $perPage);
        Response::paginated($result['items'], $result['total'], $result['page'], $result['perPage']);
    }

    // POST /comentarios
    // Requer login. Campos: texto (3–2000 chars) + nota (0–10, obrigatório).
    public static function store()
    {
        $user = AuthMiddleware::require();
        $body = Sanitizer::jsonBody();

        // Valida texto
        $texto = Sanitizer::string($body['texto'] ?? '', 2000);
        if (strlen($texto) < 3)    Response::validationError(['texto' => 'Comentário muito curto (mín. 3 caracteres).']);
        if (strlen($texto) > 2000) Response::validationError(['texto' => 'Comentário muito longo (máx. 2000 caracteres).']);

        // Valida nota — campo obrigatório
        if (!isset($body['nota']) || $body['nota'] === '' || $body['nota'] === null) {
            Response::validationError(['nota' => 'A nota é obrigatória (0 a 10).']);
        }
        $nota = Sanitizer::int($body['nota'], 0, 10);
        if ($nota === false) {
            Response::validationError(['nota' => 'Nota inválida. Use um número entre 0 e 10.']);
        }

        // Valida conteúdo
        $tipo = $body['conteudo_tipo'] ?? '';
        $cid  = (int)($body['conteudo_id'] ?? 0);
        if (!in_array($tipo, ['filme', 'serie', 'anime', 'episodio'], true) || !$cid) {
            Response::validationError(['conteudo' => 'Tipo e ID de conteúdo inválidos.']);
        }

        $id = (new ComentarioModel())->create([
            'usuario_id'    => $user['sub'],
            'papel'         => $user['papel'],
            'conteudo_tipo' => $tipo,
            'conteudo_id'   => $cid,
            'parent_id'     => !empty($body['parent_id']) ? (int)$body['parent_id'] : null,
            'texto'         => $texto,
            'nota'          => $nota,
            'ip'            => RateLimitMiddleware::getClientIp(),
            'user_agent'    => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 490),
        ]);

        $msg = in_array($user['papel'], ['admin', 'moderador'])
            ? 'Comentário publicado.'
            : 'Comentário enviado para moderação.';
        Response::success(['id' => $id], $msg, 201);
    }

    // DELETE /comentarios/{id}
    // Usuário comum: apaga apenas o próprio. Admin/moderador: apaga qualquer um.
    public static function destroy(string $id)
    {
        $user = AuthMiddleware::require();
        $ok   = (new ComentarioModel())->delete((int)$id, (int)$user['sub'], $user['papel']);
        if (!$ok) Response::error('Não foi possível excluir este comentário.', 403);
        Response::success(null, 'Comentário excluído.');
    }

    // ── Admin ─────────────────────────────────────────────────────

    public static function adminIndex()
    {
        AuthMiddleware::requireAdmin();
        $page    = Sanitizer::getInt('page', 1, 1);
        $perPage = Sanitizer::getInt('per_page', 20, 1, 100);
        $status  = Sanitizer::get('status', '');
        $result  = (new ComentarioModel())->adminList($page, $perPage, $status);
        Response::paginated($result['items'], $result['total'], $result['page'], $result['perPage']);
    }

    public static function aprovar(string $id)
    {
        AuthMiddleware::requireAdmin();
        (new ComentarioModel())->updateStatus((int)$id, 'aprovado');
        Response::success(null, 'Comentário aprovado.');
    }

    public static function marcarSpam(string $id)
    {
        AuthMiddleware::requireAdmin();
        (new ComentarioModel())->updateStatus((int)$id, 'spam');
        Response::success(null, 'Comentário marcado como spam.');
    }

    // DELETE /admin/comentarios/{id}
    // Delete direto pelo painel de admin, sem checar owner.
    public static function adminDestroy(string $id)
    {
        AuthMiddleware::requireAdmin();
        (new ComentarioModel())->adminDelete((int)$id);
        Response::success(null, 'Comentário excluído pelo admin.');
    }
}