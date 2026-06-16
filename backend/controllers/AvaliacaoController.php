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
    public static function index(string $tipo, string $id)
    {
        $model  = new AvaliacaoModel();
        $stats  = $model->stats($tipo, (int)$id);
        $minha  = null;
        $user   = AuthMiddleware::attempt();
        if ($user) $minha = $model->userNote((int)$user['sub'], $tipo, (int)$id);
        Response::success([
            'media'     => $stats['media'] ? round((float)$stats['media'], 1) : null,
            'total'     => (int)$stats['total'],
            'minha_nota'=> $minha,
        ]);
    }

    // POST /avaliacoes
    public static function store()
    {
        $user  = AuthMiddleware::require();
        $body  = Sanitizer::jsonBody();
        $tipo  = $body['conteudo_tipo'] ?? '';
        $cid   = (int)($body['conteudo_id'] ?? 0);
        $nota  = Sanitizer::int($body['nota'] ?? 0, 1, 10);

        if (!in_array($tipo, ['filme','serie','anime'], true) || !$cid) {
            Response::validationError(['conteudo' => 'Tipo e ID inválidos.']);
        }
        if ($nota === false) Response::validationError(['nota' => 'Nota deve ser entre 1 e 10.']);

        (new AvaliacaoModel())->upsert((int)$user['sub'], $tipo, $cid, $nota);
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
    public static function updatePerfil()
    {
        $user  = AuthMiddleware::require();
        $body  = Sanitizer::jsonBody();
        $model = new UsuarioModel();
        $model->updatePerfil((int)$user['sub'], [
            'nome'   => !empty($body['nome'])   ? Sanitizer::string($body['nome'], 120) : null,
            'avatar' => !empty($body['avatar'])  ? Sanitizer::string($body['avatar'], 500) : null,
        ]);
        Response::success(null, 'Perfil atualizado.');
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
}
