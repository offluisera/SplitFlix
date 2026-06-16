<?php
/**
 * Splitflix — Roteador da API REST
 */

use Helpers\Response;

// ── Carrega controllers ───────────────────────────────────────────
require_once BASE_PATH . '/controllers/AuthController.php';
require_once BASE_PATH . '/controllers/FilmeController.php';      // FilmeController + SerieController + AnimeController
require_once BASE_PATH . '/controllers/EpisodioController.php';
require_once BASE_PATH . '/controllers/ComentarioController.php';
require_once BASE_PATH . '/controllers/AvaliacaoController.php';  // AvaliacaoController + BuscaController + ProgressoController + UsuarioController
require_once BASE_PATH . '/controllers/AdminController.php';      // AdminController + AnuncioController
require_once BASE_PATH . '/controllers/ImdbController.php';

// ── Método e URI ──────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = rawurldecode($uri);

// Remove prefixos comuns (XAMPP subfolder)
$prefixes = [
    '/splitflix/backend/index.php',
    '/splitflix/backend',
    '/backend/index.php',
    '/backend',
    '/index.php',
];
foreach ($prefixes as $p) {
    if (strpos($uri, $p) === 0) {
        $uri = substr($uri, strlen($p));
        break;
    }
}

$uri = rtrim($uri, '/') ?: '/';

// ── Função de match de rota ───────────────────────────────────────
function matchRoute($pattern, $uri) {
    $regex = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $pattern);
    $regex = '#^' . $regex . '$#';
    if (preg_match($regex, $uri, $m)) {
        return array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY);
    }
    return false;
}

// ── Tabela de rotas ───────────────────────────────────────────────
$routes = [
    // Auth
    ['POST', '/auth/register',      function($p) { AuthController::register(); }],
    ['POST', '/auth/login',         function($p) { AuthController::login(); }],
    ['POST', '/auth/logout',        function($p) { AuthController::logout(); }],
    ['POST', '/auth/refresh',       function($p) { AuthController::refresh(); }],
    ['GET',  '/auth/me',            function($p) { AuthController::me(); }],

    // Público
    ['GET',  '/generos', function($p) { $s=Database::pdo()->query('SELECT id,nome,slug FROM generos ORDER BY nome'); Response::success($s->fetchAll()); }],
    ['GET',  '/home',               function($p) { BuscaController::home(); }],
    ['GET',  '/busca',              function($p) { BuscaController::search(); }],
    ['GET',  '/filmes',             function($p) { FilmeController::index(); }],
    ['GET',  '/filmes/{id}',        function($p) { FilmeController::show($p['id']); }],
    ['GET',  '/series',             function($p) { SerieController::index(); }],
    ['GET',  '/series/{id}',        function($p) { SerieController::show($p['id']); }],
    ['GET',  '/animes',             function($p) { AnimeController::index(); }],
    ['GET',  '/animes/{id}',        function($p) { AnimeController::show($p['id']); }],
    ['GET',  '/episodios/{id}',     function($p) { EpisodioController::show($p['id']); }],
    ['GET',  '/temporadas/{id}/episodios', function($p) { EpisodioController::byTemporada($p['id']); }],

    // Avaliações / Comentários
    ['POST', '/avaliacoes',         function($p) { AvaliacaoController::store(); }],
    ['GET',  '/avaliacoes/{tipo}/{id}', function($p) { AvaliacaoController::index($p['tipo'], $p['id']); }],
    ['GET',  '/comentarios/{tipo}/{id}', function($p) { ComentarioController::index($p['tipo'], $p['id']); }],
    ['POST', '/comentarios',        function($p) { ComentarioController::store(); }],
    ['DELETE','/comentarios/{id}',  function($p) { ComentarioController::destroy($p['id']); }],

    // Progresso / Lista
    ['POST', '/progresso',          function($p) { ProgressoController::upsert(); }],
    ['GET',  '/progresso',          function($p) { ProgressoController::index(); }],
    ['GET',  '/usuario/lista',      function($p) { UsuarioController::lista(); }],
    ['POST', '/usuario/lista',      function($p) { UsuarioController::addLista(); }],
    ['DELETE','/usuario/lista/{tipo}/{id}', function($p) { UsuarioController::removeLista($p['tipo'], $p['id']); }],
    ['PUT',  '/usuario/perfil',     function($p) { UsuarioController::updatePerfil(); }],

    // Anúncios público
    ['GET',  '/anuncios/{posicao}', function($p) { AnuncioController::byPosicao($p['posicao']); }],

    // Admin — IMDb
    ['GET',  '/admin/imdb/search',   function($p) { ImdbController::search(); }],
    ['GET',  '/admin/imdb/{imdbId}', function($p) { ImdbController::fetch($p['imdbId']); }],
    ['GET',  '/admin/imdb/{imdbId}/temporadas', function($p) { ImdbController::fetchTemporadas($p['imdbId']); }],
    ['GET',  '/admin/imdb/{imdbId}/episodio/{epId}', function($p) { ImdbController::fetchEpisodio($p['imdbId'], $p['epId']); }],

    // Admin — Filmes
    ['GET',  '/admin/filmes',       function($p) { FilmeController::adminIndex(); }],
    ['POST', '/admin/filmes',       function($p) { FilmeController::store(); }],
    ['GET',  '/admin/filmes/{id}',  function($p) { FilmeController::adminShow($p['id']); }],
    ['PUT',  '/admin/filmes/{id}',  function($p) { FilmeController::update($p['id']); }],
    ['DELETE','/admin/filmes/{id}', function($p) { FilmeController::destroy($p['id']); }],

    // Admin — Séries
    ['GET',  '/admin/series',       function($p) { SerieController::adminIndex(); }],
    ['POST', '/admin/series',       function($p) { SerieController::store(); }],
    ['PUT',  '/admin/series/{id}',  function($p) { SerieController::update($p['id']); }],
    ['DELETE','/admin/series/{id}', function($p) { SerieController::destroy($p['id']); }],

    // Admin — Animes
    ['GET',  '/admin/animes',       function($p) { AnimeController::adminIndex(); }],
    ['POST', '/admin/animes',       function($p) { AnimeController::store(); }],
    ['PUT',  '/admin/animes/{id}',  function($p) { AnimeController::update($p['id']); }],
    ['DELETE','/admin/animes/{id}', function($p) { AnimeController::destroy($p['id']); }],

    // Admin — Temporadas / Episódios
    ['GET',  '/admin/eps-temporada/{id}', function($p) { EpisodioController::adminByTemporadaRoute($p['id']); }],
    ['GET',  '/admin/temporadas/{tipo}/{id}', function($p) { EpisodioController::temporadasByCont($p['tipo'], $p['id']); }],
    ['POST', '/admin/temporadas',   function($p) { EpisodioController::storeTemporada(); }],
    ['PUT',  '/admin/temporadas/{id}', function($p) { EpisodioController::updateTemporada($p['id']); }],
    ['DELETE','/admin/temporadas/{id}', function($p) { EpisodioController::destroyTemporada($p['id']); }],
    ['POST', '/admin/episodios',    function($p) { EpisodioController::store(); }],
    ['PUT',  '/admin/episodios/{id}', function($p) { EpisodioController::update($p['id']); }],
    ['DELETE','/admin/episodios/{id}', function($p) { EpisodioController::destroy($p['id']); }],

    // Admin — Anúncios
    ['GET',  '/admin/anuncios',     function($p) { AnuncioController::index(); }],
    ['POST', '/admin/anuncios',     function($p) { AnuncioController::store(); }],
    ['GET',  '/admin/anuncios/{id}', function($p) { AnuncioController::show($p['id']); }],
    ['PUT',  '/admin/anuncios/{id}', function($p) { AnuncioController::update($p['id']); }],
    ['DELETE','/admin/anuncios/{id}', function($p) { AnuncioController::destroy($p['id']); }],
    ['PATCH','/admin/anuncios/{id}/toggle', function($p) { AnuncioController::toggle($p['id']); }],

    // Admin — Comentários
    ['GET',  '/admin/comentarios',  function($p) { ComentarioController::adminIndex(); }],
    ['PATCH','/admin/comentarios/{id}/aprovar', function($p) { ComentarioController::aprovar($p['id']); }],
    ['PATCH','/admin/comentarios/{id}/spam',    function($p) { ComentarioController::marcarSpam($p['id']); }],
    ['DELETE','/admin/comentarios/{id}',        function($p) { ComentarioController::destroy($p['id']); }],

    // Admin — Usuários
    ['GET',  '/admin/usuarios',     function($p) { UsuarioController::adminIndex(); }],
    ['PATCH','/admin/usuarios/{id}/status', function($p) { UsuarioController::updateStatus($p['id']); }],

    // Admin — Dashboard
    ['GET',  '/admin/dashboard',    function($p) { AdminController::dashboard(); }],
    ['GET',  '/admin/dashboard/grafico', function($p) { AdminController::graficoAcessos(); }],

    // Health
    ['GET',  '/health',             function($p) { Response::success(['status'=>'ok','php'=>PHP_VERSION,'version'=>APP_VERSION]); }],
    ['GET',  '/',                   function($p) { Response::success(['status'=>'ok','name'=>APP_NAME,'version'=>APP_VERSION]); }],
];

// ── Resolver rota ─────────────────────────────────────────────────
$matched     = false;
$routeExists = false;

foreach ($routes as $route) {
    [$routeMethod, $pattern, $handler] = $route;
    $params = matchRoute($pattern, $uri);
    if ($params === false) continue;
    $routeExists = true;
    if ($method !== $routeMethod) continue;
    $matched = true;
    $handler($params);
    break;
}

if (!$matched) {
    if (!$routeExists) {
        Response::notFound("Rota '$uri' não encontrada. [método: $method]");
    } else {
        Response::error("Método '$method' não permitido para '$uri'.", 405);
    }
}
