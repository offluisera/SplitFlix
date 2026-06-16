<?php
/**
 * Splitflix — AdminController (Dashboard)
 */

require_once BASE_PATH . '/models/FilmeModel.php';
require_once BASE_PATH . '/models/SerieModel.php';
require_once BASE_PATH . '/models/AnimeModel.php';
require_once BASE_PATH . '/models/EpisodioModel.php';
require_once BASE_PATH . '/models/ComentarioModel.php';
require_once BASE_PATH . '/models/UsuarioModel.php';
require_once BASE_PATH . '/models/ExtraModels.php';

use Helpers\Response;
use Helpers\Sanitizer;
use Middleware\AuthMiddleware;

class AdminController
{
    // GET /admin/dashboard
    public static function dashboard()
    {
        AuthMiddleware::requireAdmin();

        $acesso    = new AcessoModel();
        $usuario   = new UsuarioModel();
        $comentario= new ComentarioModel();

        Response::success([
            'totais' => [
                'filmes'    => (new FilmeModel())->count(),
                'series'    => (new SerieModel())->count(),
                'animes'    => (new AnimeModel())->count(),
                'episodios' => (new EpisodioModel())->totalCount(),
                'usuarios'  => (int) Database::pdo()->query("SELECT COUNT(*) FROM usuarios")->fetchColumn(),
            ],
            'acessos' => [
                'hoje'   => $acesso->totalHoje(),
                'semana' => $acesso->totalSemana(),
            ],
            'usuarios' => [
                'novos_hoje'   => $usuario->countNewToday(),
                'novos_semana' => $usuario->countNewThisWeek(),
            ],
            'comentarios_pendentes' => $comentario->pendingCount(),
        ]);
    }

    // GET /admin/dashboard/grafico?dias=30
    public static function graficoAcessos()
    {
        AuthMiddleware::requireAdmin();
        $dias   = Sanitizer::getInt('dias', 30, 7, 90);
        $dados  = (new AcessoModel())->porDia($dias);
        Response::success($dados);
    }
}

// ================================================================
// AnuncioController
// ================================================================

class AnuncioController
{
    // GET /anuncios/{posicao}?tipo=filme
    public static function byPosicao(string $posicao)
    {
        $tipo  = Sanitizer::get('tipo', 'todos');
        $ads   = (new AnuncioModel())->byPosicao($posicao, $tipo);
        Response::success($ads);
    }

    // GET /admin/anuncios
    public static function index()
    {
        AuthMiddleware::requireAdmin();
        $page    = Sanitizer::getInt('page', 1, 1);
        $perPage = Sanitizer::getInt('per_page', 20, 1, 100);
        $result  = (new AnuncioModel())->list($page, $perPage);
        Response::paginated($result['items'], $result['total'], $result['page'], $result['perPage']);
    }

    // GET /admin/anuncios/{id}
    public static function show(string $id)
    {
        AuthMiddleware::requireAdmin();
        $model = new AnuncioModel();
        $ad    = $model->findById((int)$id);
        if (!$ad) Response::notFound('Anúncio não encontrado.');
        Response::success($ad);
    }

    // POST /admin/anuncios
    public static function store()
    {
        $admin = AuthMiddleware::requireAdmin();
        $body  = Sanitizer::jsonBody();
        $errs  = [];
        if (empty($body['nome']))        $errs['nome']       = 'Nome obrigatório.';
        if (empty($body['codigo_html'])) $errs['codigo_html']= 'Código HTML obrigatório.';
        if (empty($body['posicao']))     $errs['posicao']    = 'Posição obrigatória.';
        if ($errs) Response::validationError($errs);

        $body['codigo_html'] = \Helpers\Sanitizer::adCode($body['codigo_html']);
        $body['criado_por']  = $admin['sub'];
        $id = (new AnuncioModel())->create($body);
        Response::success(['id' => $id], 'Anúncio criado!', 201);
    }

    // PUT /admin/anuncios/{id}
    public static function update(string $id)
    {
        AuthMiddleware::requireAdmin();
        $body = Sanitizer::jsonBody();
        if (!empty($body['codigo_html'])) {
            $body['codigo_html'] = \Helpers\Sanitizer::adCode($body['codigo_html']);
        }
        $model = new AnuncioModel();
        if (!$model->findById((int)$id)) Response::notFound('Anúncio não encontrado.');
        $model->update((int)$id, $body);
        Response::success(null, 'Anúncio atualizado.');
    }

    // DELETE /admin/anuncios/{id}
    public static function destroy(string $id)
    {
        AuthMiddleware::requireAdmin();
        (new AnuncioModel())->delete((int)$id);
        Response::success(null, 'Anúncio excluído.');
    }

    // PATCH /admin/anuncios/{id}/toggle
    public static function toggle(string $id)
    {
        AuthMiddleware::requireAdmin();
        $result = (new AnuncioModel())->toggle((int)$id);
        Response::success($result, $result['status'] ? 'Anúncio ativado.' : 'Anúncio desativado.');
    }
}
