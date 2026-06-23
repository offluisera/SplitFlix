<?php
/**
 * Splitflix — Roteador da API REST (v2)
 */

use Helpers\Response;

require_once BASE_PATH . '/controllers/AuthController.php';
require_once BASE_PATH . '/controllers/FilmeController.php';
require_once BASE_PATH . '/controllers/EpisodioController.php';
require_once BASE_PATH . '/controllers/ComentarioController.php';
require_once BASE_PATH . '/controllers/AvaliacaoController.php';
require_once BASE_PATH . '/controllers/AdminController.php';
require_once BASE_PATH . '/controllers/ImdbController.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = rawurldecode($uri);

foreach (['/splitflix/backend/index.php','/splitflix/backend','/backend/index.php','/backend','/index.php'] as $p) {
    if (strpos($uri, $p) === 0) { $uri = substr($uri, strlen($p)); break; }
}
$uri = rtrim($uri, '/') ?: '/';

function matchRoute($pattern, $uri) {
    $regex = '#^' . preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $pattern) . '$#';
    return preg_match($regex, $uri, $m) ? array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY) : false;
}

$routes = [
    // ── Auth ──────────────────────────────────────────────────────
    ['POST', '/auth/register',      fn($p) => AuthController::register()],
    ['POST', '/auth/login',         fn($p) => AuthController::login()],
    ['POST', '/auth/logout',        fn($p) => AuthController::logout()],
    ['POST', '/auth/refresh',       fn($p) => AuthController::refresh()],
    ['GET',  '/auth/me',            fn($p) => AuthController::me()],

    // ── Público ───────────────────────────────────────────────────
    ['GET',  '/generos',            fn($p) => Response::success(Database::pdo()->query('SELECT id,nome,slug FROM generos ORDER BY nome')->fetchAll())],
    ['GET',  '/home',               fn($p) => BuscaController::home()],
    ['GET',  '/busca',              fn($p) => BuscaController::search()],
    ['GET',  '/filmes',             fn($p) => FilmeController::index()],
    ['GET',  '/filmes/{id}',        fn($p) => FilmeController::show($p['id'])],
    ['GET',  '/series',             fn($p) => SerieController::index()],
    ['GET',  '/series/{id}',        fn($p) => SerieController::show($p['id'])],
    ['GET',  '/animes',             fn($p) => AnimeController::index()],
    ['GET',  '/animes/{id}',        fn($p) => AnimeController::show($p['id'])],
    ['GET',  '/episodios/{id}',     fn($p) => EpisodioController::show($p['id'])],
    ['GET',  '/temporadas/{id}/episodios', fn($p) => EpisodioController::byTemporada($p['id'])],

    // ── Avaliações (GET público, POST requer login) ───────────────
    ['GET',  '/avaliacoes/{tipo}/{id}', fn($p) => AvaliacaoController::index($p['tipo'], $p['id'])],
    ['POST', '/avaliacoes',         fn($p) => AvaliacaoController::store()],

    // ── Comentários (GET público, POST/DELETE requer login) ───────
    ['GET',  '/comentarios/{tipo}/{id}', fn($p) => ComentarioController::index($p['tipo'], $p['id'])],
    ['POST', '/comentarios',        fn($p) => ComentarioController::store()],
    ['DELETE','/comentarios/{id}',  fn($p) => ComentarioController::destroy($p['id'])],

    // ── Progresso / Lista ─────────────────────────────────────────
    ['POST', '/progresso',          fn($p) => ProgressoController::upsert()],
    ['GET',  '/progresso',          fn($p) => ProgressoController::index()],
    ['GET',  '/usuario/lista',      fn($p) => UsuarioController::lista()],
    ['POST', '/usuario/lista',      fn($p) => UsuarioController::addLista()],
    ['DELETE','/usuario/lista/{tipo}/{id}', fn($p) => UsuarioController::removeLista($p['tipo'], $p['id'])],
    ['PUT',  '/usuario/perfil',     fn($p) => UsuarioController::updatePerfil()],
    ['PUT',  '/usuario/senha',      fn($p) => UsuarioController::updateSenha()],

    // ── Anúncios público ──────────────────────────────────────────
    ['GET',  '/anuncios/{posicao}', fn($p) => AnuncioController::byPosicao($p['posicao'])],

    // ── Admin — IMDb ──────────────────────────────────────────────
    ['GET',  '/admin/imdb/search',                      fn($p) => ImdbController::search()],
    ['GET',  '/admin/imdb/{imdbId}',                    fn($p) => ImdbController::fetch($p['imdbId'])],
    ['GET',  '/admin/imdb/{imdbId}/temporadas',         fn($p) => ImdbController::fetchTemporadas($p['imdbId'])],
    ['GET',  '/admin/imdb/{imdbId}/episodio/{epId}',    fn($p) => ImdbController::fetchEpisodio($p['imdbId'], $p['epId'])],

    // ── Admin — Filmes ────────────────────────────────────────────
    ['GET',    '/admin/filmes',        fn($p) => FilmeController::adminIndex()],
    ['POST',   '/admin/filmes',        fn($p) => FilmeController::store()],
    ['GET',    '/admin/filmes/{id}',   fn($p) => FilmeController::adminShow($p['id'])],
    ['PUT',    '/admin/filmes/{id}',   fn($p) => FilmeController::update($p['id'])],
    ['DELETE', '/admin/filmes/{id}',   fn($p) => FilmeController::destroy($p['id'])],

    // ── Admin — Séries ────────────────────────────────────────────
    ['GET',    '/admin/series',        fn($p) => SerieController::adminIndex()],
    ['POST',   '/admin/series',        fn($p) => SerieController::store()],
    ['PUT',    '/admin/series/{id}',   fn($p) => SerieController::update($p['id'])],
    ['DELETE', '/admin/series/{id}',   fn($p) => SerieController::destroy($p['id'])],

    // ── Admin — Animes ────────────────────────────────────────────
    ['GET',    '/admin/animes',        fn($p) => AnimeController::adminIndex()],
    ['POST',   '/admin/animes',        fn($p) => AnimeController::store()],
    ['PUT',    '/admin/animes/{id}',   fn($p) => AnimeController::update($p['id'])],
    ['DELETE', '/admin/animes/{id}',   fn($p) => AnimeController::destroy($p['id'])],

    // ── Admin — Temporadas / Episódios ────────────────────────────
    ['GET',    '/admin/eps-temporada/{id}',        fn($p) => EpisodioController::adminByTemporadaRoute($p['id'])],
    ['GET',    '/admin/temporadas/{tipo}/{id}',    fn($p) => EpisodioController::temporadasByCont($p['tipo'], $p['id'])],
    ['POST',   '/admin/temporadas',               fn($p) => EpisodioController::storeTemporada()],
    ['PUT',    '/admin/temporadas/{id}',           fn($p) => EpisodioController::updateTemporada($p['id'])],
    ['DELETE', '/admin/temporadas/{id}',           fn($p) => EpisodioController::destroyTemporada($p['id'])],
    ['POST',   '/admin/episodios',                fn($p) => EpisodioController::store()],
    ['PUT',    '/admin/episodios/{id}',            fn($p) => EpisodioController::update($p['id'])],
    ['DELETE', '/admin/episodios/{id}',            fn($p) => EpisodioController::destroy($p['id'])],

    // ── Admin — Anúncios ──────────────────────────────────────────
    ['GET',    '/admin/anuncios',          fn($p) => AnuncioController::index()],
    ['POST',   '/admin/anuncios',          fn($p) => AnuncioController::store()],
    ['GET',    '/admin/anuncios/{id}',     fn($p) => AnuncioController::show($p['id'])],
    ['PUT',    '/admin/anuncios/{id}',     fn($p) => AnuncioController::update($p['id'])],
    ['DELETE', '/admin/anuncios/{id}',     fn($p) => AnuncioController::destroy($p['id'])],
    ['PATCH',  '/admin/anuncios/{id}/toggle', fn($p) => AnuncioController::toggle($p['id'])],

    // ── Admin — Comentários ───────────────────────────────────────
    ['GET',    '/admin/comentarios',                   fn($p) => ComentarioController::adminIndex()],
    ['PATCH',  '/admin/comentarios/{id}/aprovar',      fn($p) => ComentarioController::aprovar($p['id'])],
    ['PATCH',  '/admin/comentarios/{id}/spam',         fn($p) => ComentarioController::marcarSpam($p['id'])],
    ['DELETE', '/admin/comentarios/{id}',              fn($p) => ComentarioController::adminDestroy($p['id'])],

    // ── Admin — Usuários ──────────────────────────────────────────
    ['GET',   '/admin/usuarios',              fn($p) => UsuarioController::adminIndex()],
    ['PATCH', '/admin/usuarios/{id}/status',  fn($p) => UsuarioController::updateStatus($p['id'])],

    // ── Admin — Dashboard ─────────────────────────────────────────
    ['GET', '/admin/dashboard',         fn($p) => AdminController::dashboard()],
    ['GET', '/admin/dashboard/grafico', fn($p) => AdminController::graficoAcessos()],

    // ── Health / Root ─────────────────────────────────────────────
    ['GET', '/health', fn($p) => Response::success(['status'=>'ok','php'=>PHP_VERSION,'version'=>APP_VERSION])],
    ['GET', '/',       fn($p) => Response::success(['status'=>'ok','name'=>APP_NAME,'version'=>APP_VERSION])],
];

$matched = $routeExists = false;
foreach ($routes as [$routeMethod, $pattern, $handler]) {
    $params = matchRoute($pattern, $uri);
    if ($params === false) continue;
    $routeExists = true;
    if ($method !== $routeMethod) continue;
    $matched = true;
    $handler($params);
    break;
}

if (!$matched) {
    $routeExists
        ? Response::error("Método '$method' não permitido para '$uri'.", 405)
        : Response::notFound("Rota '$uri' não encontrada. [método: $method]");
}