<?php
/**
 * Splitflix — AvaliacaoController
 */

require_once BASE_PATH . '/models/ExtraModels.php';
use Helpers\Response;
use Helpers\Sanitizer;
use Middleware\AuthMiddleware;

class AvaliacaoController
{
    // GET /avaliacoes/{tipo}/{id}
    // Retorna stats + lista paginada de avaliações com comentário (visível para qualquer pessoa)
    public static function index(string $tipo, string $id)
    {
        $model  = new AvaliacaoModel();
        $stats  = $model->stats($tipo, (int)$id);
        $minha  = null;
        $minhaReview = null;
        $user   = AuthMiddleware::attempt();
        if ($user) {
            $minha = $model->userNote((int)$user['sub'], $tipo, (int)$id);
            $minhaReview = $model->userReview((int)$user['sub'], $tipo, (int)$id);
        }

        $page    = Sanitizer::getInt('page', 1, 1);
        $perPage = Sanitizer::getInt('per_page', 10, 1, 50);
        $lista   = $model->listByConteudo($tipo, (int)$id, $page, $perPage);

        Response::success([
            'media'        => $stats['media'] ? round((float)$stats['media'], 1) : null,
            'total'        => (int)$stats['total'],
            'minha_nota'   => $minha,
            'minha_review' => $minhaReview,
            'avaliacoes'   => $lista['items'],
            'meta'         => [
                'total'       => $lista['total'],
                'page'        => $lista['page'],
                'per_page'    => $lista['perPage'],
                'total_pages' => (int) ceil($lista['total'] / max(1, $lista['perPage'])),
            ],
        ]);
    }

    // POST /avaliacoes
    // Requer login. Aceita nota (1-10) + comentario (descrição/motivo da avaliação).
    public static function store()
    {
        $user  = AuthMiddleware::require();
        $body  = Sanitizer::jsonBody();
        $tipo  = $body['conteudo_tipo'] ?? '';
        $cid   = (int)($body['conteudo_id'] ?? 0);
        $nota  = Sanitizer::int($body['nota'] ?? 0, 1, 10);
        $comentario = Sanitizer::string($body['comentario'] ?? '', 1000);

        if (!in_array($tipo, ['filme','serie','anime'], true) || !$cid) {
            Response::validationError(['conteudo' => 'Tipo e ID inválidos.']);
        }
        if ($nota === false) Response::validationError(['nota' => 'Nota deve ser entre 1 e 10.']);
        if (strlen($comentario) < 3) {
            Response::validationError(['comentario' => 'Conte um pouco sobre sua avaliação (mín. 3 caracteres).']);
        }

        (new AvaliacaoModel())->upsert((int)$user['sub'], $tipo, $cid, $nota, $comentario);
        Response::success(null, 'Avaliação registrada!');
    }
}

// ================================================================

class BuscaController
{
    // GET /busca?q=termo
    public static function search()
    {
        $q = Sanitizer::get('q', '');
        if (strlen(trim($q)) < 2) Response::validationError(['q' => 'Busca muito curta.']);

        require_once BASE_PATH . '/models/FilmeModel.php';
        require_once BASE_PATH . '/models/SerieModel.php';
        require_once BASE_PATH . '/models/AnimeModel.php';

        $limit   = Sanitizer::getInt('limit', 10, 1, 30);
        $filmes  = (new FilmeModel())->search($q, $limit);
        $series  = (new SerieModel())->search($q, $limit);
        $animes  = (new AnimeModel())->search($q, $limit);

        $all = array_merge($filmes, $series, $animes);
        usort($all, fn($a,$b) => ($b['nota_imdb'] ?? 0) <=> ($a['nota_imdb'] ?? 0));

        Response::success([
            'query'  => $q,
            'total'  => count($all),
            'filmes' => $filmes,
            'series' => $series,
            'animes' => $animes,
        ]);
    }

    // GET /home
    public static function home()
    {
        require_once BASE_PATH . '/models/FilmeModel.php';
        require_once BASE_PATH . '/models/SerieModel.php';
        require_once BASE_PATH . '/models/AnimeModel.php';

        $fm = new FilmeModel();
        $sm = new SerieModel();
        $am = new AnimeModel();

        $continueWatching = [];
        $user = AuthMiddleware::attempt();
        if ($user) {
            $prog = new ProgressoModel();
            $continueWatching = $prog->continueWatching((int)$user['sub'], 10);
        }

        Response::success([
            'hero'              => array_merge($fm->destaques(3), $sm->destaques(2), $am->destaques(2)),
            'filmes_em_alta'    => $fm->emAlta(12),
            'series_populares'  => $sm->emAlta(12),
            'animes_destaque'   => $am->emAlta(12),
            'continue_assistindo' => $continueWatching,
        ]);
    }
}

// ================================================================

class ProgressoController
{
    // POST /progresso
    public static function upsert()
    {
        $user = AuthMiddleware::require();
        $body = Sanitizer::jsonBody();
        $tipo = $body['conteudo_tipo'] ?? '';
        $cid  = (int)($body['conteudo_id'] ?? 0);
        $pos  = (int)($body['posicao_seg'] ?? 0);
        $dur  = isset($body['duracao_seg']) ? (int)$body['duracao_seg'] : null;
        if (!in_array($tipo, ['filme','episodio'], true) || !$cid) {
            Response::validationError(['conteudo' => 'Tipo e ID inválidos.']);
        }
        (new ProgressoModel())->upsert((int)$user['sub'], $tipo, $cid, $pos, $dur);
        Response::success(null, 'Progresso salvo.');
    }

    // GET /progresso
    public static function index()
    {
        $user = AuthMiddleware::require();
        Response::success((new ProgressoModel())->continueWatching((int)$user['sub']));
    }
}

// ================================================================

class UsuarioController
{
    // GET /usuario/lista
    public static function lista()
    {
        $user  = AuthMiddleware::require();
        $db    = Database::pdo();
        $stmt  = $db->prepare("SELECT * FROM lista_usuario WHERE usuario_id=? ORDER BY criado_em DESC");
        $stmt->execute([$user['sub']]);
        Response::success($stmt->fetchAll());
    }

    // POST /usuario/lista
    public static function addLista()
    {
        $user = AuthMiddleware::require();
        $body = Sanitizer::jsonBody();
        $tipo = $body['conteudo_tipo'] ?? '';
        $cid  = (int)($body['conteudo_id'] ?? 0);
        if (!in_array($tipo, ['filme','serie','anime'], true) || !$cid) {
            Response::validationError(['conteudo' => 'Tipo e ID inválidos.']);
        }
        $db = Database::pdo();
        $db->prepare("INSERT IGNORE INTO lista_usuario (usuario_id,conteudo_tipo,conteudo_id) VALUES (?,?,?)")
           ->execute([$user['sub'], $tipo, $cid]);
        Response::success(null, 'Adicionado à lista.', 201);
    }

    // DELETE /usuario/lista/{tipo}/{id}
    public static function removeLista(string $tipo, string $id)
    {
        $user = AuthMiddleware::require();
        Database::pdo()->prepare("DELETE FROM lista_usuario WHERE usuario_id=? AND conteudo_tipo=? AND conteudo_id=?")
            ->execute([$user['sub'], $tipo, (int)$id]);
        Response::success(null, 'Removido da lista.');
    }

    // PUT /usuario/perfil
    // Aceita nome e/ou avatar (avatar pode ser uma string base64 de imagem ou uma URL)
    public static function updatePerfil()
    {
        $user  = AuthMiddleware::require();
        $body  = Sanitizer::jsonBody();
        $model = new UsuarioModel();

        $avatarUrl = null;
        if (!empty($body['avatar_base64'])) {
            $avatarUrl = self::salvarAvatarBase64($body['avatar_base64'], (int)$user['sub']);
            if ($avatarUrl === false) {
                Response::validationError(['avatar' => 'Imagem inválida. Use JPG, PNG ou WEBP de até ' . UPLOAD_MAX_MB . 'MB.']);
            }
        } elseif (!empty($body['avatar'])) {
            $avatarUrl = Sanitizer::string($body['avatar'], 500);
        }

        $model->updatePerfil((int)$user['sub'], [
            'nome'   => !empty($body['nome']) ? Sanitizer::string($body['nome'], 120) : null,
            'avatar' => $avatarUrl,
        ]);

        $atualizado = $model->findById((int)$user['sub']);
        Response::success($model->publicProfile($atualizado), 'Perfil atualizado.');
    }

    // PUT /usuario/senha
    public static function updateSenha()
    {
        $user  = AuthMiddleware::require();
        $body  = Sanitizer::jsonBody();
        $atual = $body['senha_atual'] ?? '';
        $nova  = $body['nova_senha']  ?? '';

        $model    = new UsuarioModel();
        $registro = $model->findById((int)$user['sub']);

        if (!$registro || !password_verify($atual, $registro['senha_hash'])) {
            Response::error('Senha atual incorreta.', 401);
        }
        if (strlen($nova) < 8 || !preg_match('/[A-Z]/', $nova) || !preg_match('/[0-9]/', $nova)) {
            Response::validationError(['nova_senha' => 'A nova senha deve ter 8+ caracteres, 1 maiúscula e 1 número.']);
        }

        $hash = password_hash($nova, PASSWORD_BCRYPT, ['cost' => 12]);
        Database::pdo()->prepare("UPDATE usuarios SET senha_hash=? WHERE id=?")->execute([$hash, $user['sub']]);
        Response::success(null, 'Senha atualizada com sucesso.');
    }

    // ── Admin ─────────────────────────────────────────────────────

    public static function adminIndex()
    {
        AuthMiddleware::requireAdmin();
        $page    = Sanitizer::getInt('page', 1, 1);
        $perPage = Sanitizer::getInt('per_page', 20, 1, 100);
        $search  = Sanitizer::get('q', '');
        $result  = (new UsuarioModel())->adminList($page, $perPage, $search);
        Response::paginated($result['items'], $result['total'], $result['page'], $result['perPage']);
    }

    public static function updateStatus(string $id)
    {
        AuthMiddleware::requireSuperAdmin();
        $body   = Sanitizer::jsonBody();
        $status = $body['status'] ?? '';
        if (!in_array($status, ['ativo','inativo','banido'], true)) {
            Response::validationError(['status' => 'Status inválido.']);
        }
        (new UsuarioModel())->updateStatus((int)$id, $status);
        Response::success(null, 'Status atualizado.');
    }

    // ── Helper privado: salva avatar enviado em base64 e retorna a URL pública ──
    private static function salvarAvatarBase64(string $base64, int $userId)
    {
        if (!preg_match('/^data:(image\/(jpeg|png|webp));base64,(.+)$/', $base64, $m)) {
            return false;
        }
        $mime = $m[1];
        $ext  = match($mime) {
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            default      => null,
        };
        if (!$ext || !in_array($mime, UPLOAD_ALLOWED_TYPES, true)) return false;

        $data = base64_decode($m[3]);
        if ($data === false) return false;
        if (strlen($data) > UPLOAD_MAX_MB * 1024 * 1024) return false;

        $dir = UPLOAD_PATH . 'avatars/';
        if (!is_dir($dir)) @mkdir($dir, 0755, true);

        $filename = 'user_' . $userId . '_' . time() . '.' . $ext;
        $path     = $dir . $filename;
        if (file_put_contents($path, $data) === false) return false;

        // Limpa avatares antigos deste usuário (mantém apenas o novo)
        foreach (glob($dir . 'user_' . $userId . '_*') as $old) {
            if ($old !== $path) @unlink($old);
        }

        return rtrim(APP_URL, '/') . '/uploads/avatars/' . $filename;
    }
}