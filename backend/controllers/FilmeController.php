<?php
/**
 * Splitflix — FilmeController
 */



require_once BASE_PATH . '/models/FilmeModel.php';
use Helpers\Response;
use Helpers\Sanitizer;
use Middleware\AuthMiddleware;

class FilmeController
{
    // ── GET /filmes ───────────────────────────────────────────────
    public static function index(
    {
        $page    = Sanitizer::getInt('page', 1, 1);
        $perPage = Sanitizer::getInt('per_page', DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
        $filters = [
            'ano'    => Sanitizer::get('ano'),
            'genero' => Sanitizer::get('genero'),
        ];
        $model  = new FilmeModel();
        $result = $model->publicList($page, $perPage, $filters);
        Response::paginated($result['items'], $result['total'], $result['page'], $result['perPage']);
    }

    // ── GET /filmes/{id} ──────────────────────────────────────────
    public static function show(string $id
    {
        $model = new FilmeModel();
        // Aceita slug ou ID numérico
        $filme = is_numeric($id) ? $model->adminFindById((int)$id) : $model->findBySlug($id);
        if (!$filme) Response::notFound('Filme não encontrado.');
        Response::success($filme);
    }

    // ── GET /admin/filmes ─────────────────────────────────────────
    public static function adminIndex(
    {
        AuthMiddleware::requireAdmin();
        $page    = Sanitizer::getInt('page', 1, 1);
        $perPage = Sanitizer::getInt('per_page', DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
        $filters = ['status' => Sanitizer::get('status')];
        $result  = (new FilmeModel())->adminList($page, $perPage, $filters);
        Response::paginated($result['items'], $result['total'], $result['page'], $result['perPage']);
    }

    // ── GET /admin/filmes/{id} ────────────────────────────────────
    public static function adminShow(string $id
    {
        AuthMiddleware::requireAdmin();
        $filme = (new FilmeModel())->adminFindById((int)$id);
        if (!$filme) Response::notFound('Filme não encontrado.');
        Response::success($filme);
    }

    // ── POST /admin/filmes ────────────────────────────────────────
    public static function store(
    {
        $admin = AuthMiddleware::requireAdmin();
        $body  = Sanitizer::jsonBody();
        $data  = self::validate($body);
        $data['criado_por'] = $admin['sub'];
        $data['slug'] = self::makeSlug($data['titulo'], $body['slug'] ?? '');
        $id = (new FilmeModel())->create($data);
        Response::success(['id' => $id], 'Filme cadastrado com sucesso!', 201);
    }

    // ── PUT /admin/filmes/{id} ────────────────────────────────────
    public static function update(string $id
    {
        AuthMiddleware::requireAdmin();
        $body  = Sanitizer::jsonBody();
        $model = new FilmeModel();
        if (!$model->exists((int)$id)) Response::notFound('Filme não encontrado.');
        $data = self::validate($body, true);
        if (!empty($body['slug'])) $data['slug'] = Sanitizer::slug($body['slug']);
        $model->update((int)$id, $data);
        Response::success(null, 'Filme atualizado.');
    }

    // ── DELETE /admin/filmes/{id} ─────────────────────────────────
    public static function destroy(string $id
    {
        AuthMiddleware::requireSuperAdmin();
        $model = new FilmeModel();
        if (!$model->exists((int)$id)) Response::notFound('Filme não encontrado.');
        $model->delete((int)$id);
        Response::success(null, 'Filme excluído.');
    }

    private static function validate(array $b, bool $partial = false): array
    {
        $errors = [];
        if (!$partial && empty($b['titulo'])) $errors['titulo'] = 'Título obrigatório.';
        if (!empty($b['nota_imdb']) && ($b['nota_imdb'] < 0 || $b['nota_imdb'] > 10)) $errors['nota_imdb'] = 'Nota entre 0 e 10.';
        if ($errors) Response::validationError($errors);

        return array_filter([
            'imdb_id'          => !empty($b['imdb_id'])    ? Sanitizer::imdbId($b['imdb_id']) : null,
            'titulo'           => !empty($b['titulo'])     ? Sanitizer::string($b['titulo'], 255) : null,
            'titulo_original'  => !empty($b['titulo_original']) ? Sanitizer::string($b['titulo_original'], 255) : null,
            'sinopse'          => !empty($b['sinopse'])    ? Sanitizer::string($b['sinopse'], 5000) : null,
            'ano'              => !empty($b['ano'])        ? (int)$b['ano'] : null,
            'duracao_min'      => !empty($b['duracao_min'])? (int)$b['duracao_min'] : null,
            'classificacao'    => !empty($b['classificacao']) ? Sanitizer::string($b['classificacao'], 10) : null,
            'nota_imdb'        => isset($b['nota_imdb'])   ? (float)$b['nota_imdb'] : null,
            'diretor'          => !empty($b['diretor'])    ? Sanitizer::string($b['diretor'], 200) : null,
            'elenco'           => $b['elenco']             ?? null,
            'poster_url'       => !empty($b['poster_url']) ? Sanitizer::string($b['poster_url'], 500) : null,
            'backdrop_url'     => !empty($b['backdrop_url'])? Sanitizer::string($b['backdrop_url'], 500) : null,
            'trailer_youtube'  => !empty($b['trailer_youtube']) ? Sanitizer::string($b['trailer_youtube'], 50) : null,
            'embed_dailymotion'=> !empty($b['embed_dailymotion']) ? Sanitizer::string($b['embed_dailymotion'], 500) : null,
            'destaque'         => isset($b['destaque'])    ? (int)(bool)$b['destaque'] : null,
            'em_alta'          => isset($b['em_alta'])     ? (int)(bool)$b['em_alta'] : null,
            'status'           => !empty($b['status'])     ? $b['status'] : null,
            'generos'          => $b['generos']            ?? null,
        ], fn($v) => $v !== null);
    }

    private static function makeSlug(string $titulo, string $custom = ''): string
    {
        $base  = Sanitizer::slug($custom ?: $titulo);
        $model = new FilmeModel();
        $slug  = $base;
        $i     = 1;
        while ($model->slugExists($slug)) { $slug = "$base-$i"; $i++; }
        return $slug;
    }
}

// ================================================================
// SerieController
// ================================================================

require_once BASE_PATH . '/models/SerieModel.php';

class SerieController
{
    public static function index(
    {
        $page    = Sanitizer::getInt('page', 1, 1);
        $perPage = Sanitizer::getInt('per_page', DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
        $result  = (new SerieModel())->publicList($page, $perPage, ['ano' => Sanitizer::get('ano')]);
        Response::paginated($result['items'], $result['total'], $result['page'], $result['perPage']);
    }

    public static function show(string $id
    {
        $model = new SerieModel();
        $serie = is_numeric($id) ? $model->findById((int)$id) : $model->findBySlug($id);
        if (!$serie) Response::notFound('Série não encontrada.');
        Response::success($serie);
    }

    public static function adminIndex(
    {
        AuthMiddleware::requireAdmin();
        $page   = Sanitizer::getInt('page', 1, 1);
        $perPage= Sanitizer::getInt('per_page', DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
        $result = (new SerieModel())->adminList($page, $perPage, ['status'=>Sanitizer::get('status')]);
        Response::paginated($result['items'], $result['total'], $result['page'], $result['perPage']);
    }

    public static function store(
    {
        $admin = AuthMiddleware::requireAdmin();
        $body  = Sanitizer::jsonBody();
        if (empty($body['titulo'])) Response::validationError(['titulo'=>'Título obrigatório.']);
        $model = new SerieModel();
        $slug  = Sanitizer::slug($body['slug'] ?? $body['titulo']);
        $id    = $model->create(array_merge($body, ['slug'=>$slug,'criado_por'=>$admin['sub']]));
        Response::success(['id'=>$id], 'Série cadastrada!', 201);
    }

    public static function update(string $id
    {
        AuthMiddleware::requireAdmin();
        $model = new SerieModel();
        if (!$model->exists((int)$id)) Response::notFound('Série não encontrada.');
        $model->update((int)$id, Sanitizer::jsonBody());
        Response::success(null, 'Série atualizada.');
    }

    public static function destroy(string $id
    {
        AuthMiddleware::requireSuperAdmin();
        (new SerieModel())->delete((int)$id);
        Response::success(null, 'Série excluída.');
    }
}

// ================================================================
// AnimeController
// ================================================================

require_once BASE_PATH . '/models/AnimeModel.php';

class AnimeController
{
    public static function index(
    {
        $page    = Sanitizer::getInt('page', 1, 1);
        $perPage = Sanitizer::getInt('per_page', DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
        $result  = (new AnimeModel())->publicList($page, $perPage, ['ano'=>Sanitizer::get('ano')]);
        Response::paginated($result['items'], $result['total'], $result['page'], $result['perPage']);
    }

    public static function show(string $id
    {
        $model = new AnimeModel();
        $anime = is_numeric($id) ? $model->findById((int)$id) : $model->findBySlug($id);
        if (!$anime) Response::notFound('Anime não encontrado.');
        Response::success($anime);
    }

    public static function adminIndex(
    {
        AuthMiddleware::requireAdmin();
        $page    = Sanitizer::getInt('page', 1, 1);
        $perPage = Sanitizer::getInt('per_page', DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
        $result  = (new AnimeModel())->adminList($page, $perPage, ['status'=>Sanitizer::get('status')]);
        Response::paginated($result['items'], $result['total'], $result['page'], $result['perPage']);
    }

    public static function store(
    {
        $admin = AuthMiddleware::requireAdmin();
        $body  = Sanitizer::jsonBody();
        if (empty($body['titulo'])) Response::validationError(['titulo'=>'Título obrigatório.']);
        $slug  = Sanitizer::slug($body['slug'] ?? $body['titulo']);
        $id    = (new AnimeModel())->create(array_merge($body, ['slug'=>$slug,'criado_por'=>$admin['sub']]));
        Response::success(['id'=>$id], 'Anime cadastrado!', 201);
    }

    public static function update(string $id
    {
        AuthMiddleware::requireAdmin();
        $model = new AnimeModel();
        if (!$model->exists((int)$id)) Response::notFound('Anime não encontrado.');
        $model->update((int)$id, Sanitizer::jsonBody());
        Response::success(null, 'Anime atualizado.');
    }

    public static function destroy(string $id
    {
        AuthMiddleware::requireSuperAdmin();
        (new AnimeModel())->delete((int)$id);
        Response::success(null, 'Anime excluído.');
    }
}
