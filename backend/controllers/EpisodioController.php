<?php
/**
 * Splitflix — EpisodioController
 */



require_once BASE_PATH . '/models/EpisodioModel.php';
use Helpers\Response;
use Helpers\Sanitizer;
use Middleware\AuthMiddleware;

class EpisodioController
{
    public static function show(string $id
    {
        $ep = (new EpisodioModel())->findById((int)$id);
        if (!$ep) Response::notFound('Episódio não encontrado.');
        Response::success($ep);
    }

    public static function byTemporada(string $id
    {
        Response::success((new EpisodioModel())->byTemporada((int)$id));
    }

    public static function temporadasByCont(string $tipo, string $id
    {
        AuthMiddleware::requireAdmin();
        Response::success((new EpisodioModel())->getTemporadasAdmin((int)$id, $tipo));
    }

    public static function storeTemporada(
    {
        AuthMiddleware::requireAdmin();
        $body = Sanitizer::jsonBody();
        if (empty($body['conteudo_id']) || empty($body['conteudo_tipo']) || empty($body['numero'])) {
            Response::validationError(['campos'=>'conteudo_id, conteudo_tipo e numero são obrigatórios.']);
        }
        $id = (new EpisodioModel())->createTemporada($body);
        Response::success(['id'=>$id], 'Temporada criada!', 201);
    }

    public static function updateTemporada(string $id
    {
        AuthMiddleware::requireAdmin();
        (new EpisodioModel())->updateTemporada((int)$id, Sanitizer::jsonBody());
        Response::success(null, 'Temporada atualizada.');
    }

    public static function destroyTemporada(string $id
    {
        AuthMiddleware::requireAdmin();
        (new EpisodioModel())->deleteTemporada((int)$id);
        Response::success(null, 'Temporada excluída.');
    }

    public static function store(
    {
        AuthMiddleware::requireAdmin();
        $body = Sanitizer::jsonBody();
        $errs = [];
        if (empty($body['temporada_id'])) $errs['temporada_id'] = 'Obrigatório.';
        if (empty($body['numero']))       $errs['numero']       = 'Obrigatório.';
        if (empty($body['titulo']))       $errs['titulo']       = 'Obrigatório.';
        if (empty($body['embed_dailymotion'])) $errs['embed_dailymotion'] = 'Link do Dailymotion obrigatório.';
        if ($errs) Response::validationError($errs);
        $id = (new EpisodioModel())->create($body);
        Response::success(['id'=>$id], 'Episódio criado!', 201);
    }

    public static function update(string $id
    {
        AuthMiddleware::requireAdmin();
        (new EpisodioModel())->update((int)$id, Sanitizer::jsonBody());
        Response::success(null, 'Episódio atualizado.');
    }

    public static function destroy(string $id
    {
        AuthMiddleware::requireAdmin();
        (new EpisodioModel())->delete((int)$id);
        Response::success(null, 'Episódio excluído.');
    }
}

    // Admin: lista todos os episodios (inclusive rascunhos)
    public static function adminByTemporadaRoute($tempId)
    {
        AuthMiddleware::requireAdmin();
        $eps = (new EpisodioModel())->adminByTemporada((int)$tempId);
        Response::success($eps);
    }
