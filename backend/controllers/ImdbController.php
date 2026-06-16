<?php
/**
 * Splitflix — ImdbController
 * Busca por nome + importação automática de temporadas/episódios
 */

use Helpers\Response;
use Helpers\Sanitizer;
use Middleware\AuthMiddleware;

class ImdbController
{
    // GET /admin/imdb/search?q=nome
    public static function search()
    {
        AuthMiddleware::requireAdmin();
        $q = Sanitizer::get('q', '');
        if (strlen(trim($q)) < 2) Response::validationError(['q' => 'Digite ao menos 2 caracteres.']);

        $results = ImdbScraperService::search($q);
        Response::success($results);
    }

    // GET /admin/imdb/{imdbId}
    public static function fetch($imdbId)
    {
        AuthMiddleware::requireAdmin();
        $id = Sanitizer::imdbId($imdbId);
        if (!$id) Response::validationError(['imdb_id' => 'ID IMDb inválido. Use o formato ttXXXXXXX.']);

        $data = ImdbScraperService::fetch($id);
        if (!$data) Response::error('Não foi possível obter dados do IMDb. Verifique o ID.', 422);
        Response::success($data);
    }

    // GET /admin/imdb/{imdbId}/temporadas — busca todas as temporadas e episódios
    public static function fetchTemporadas($imdbId)
    {
        AuthMiddleware::requireAdmin();
        $id = Sanitizer::imdbId($imdbId);
        if (!$id) Response::validationError(['imdb_id' => 'ID inválido.']);

        $data = ImdbScraperService::fetchTemporadas($id);
        Response::success($data);
    }

    // GET /admin/imdb/{imdbId}/episodio/{epId}
    public static function fetchEpisodio($imdbId, $epId)
    {
        AuthMiddleware::requireAdmin();
        $epid = Sanitizer::imdbId($epId);
        if (!$epid) Response::validationError(['imdb_id' => 'ID inválido.']);

        $data = ImdbScraperService::fetchEpisodio($epid);
        if (!$data) Response::error('Não foi possível obter dados do episódio.', 422);
        Response::success($data);
    }
}

// ================================================================
class ImdbScraperService
{
    private const OMDB_KEY = 'COLOQUE_SUA_CHAVE_OMDB_AQUI'; // omdbapi.com - grátis
    private const OMDB_URL = 'https://www.omdbapi.com/';
    private const TIMEOUT  = 12;

    // ── Busca por nome ────────────────────────────────────────────
    public static function search($query)
    {
        $results = [];

        // Busca filmes e séries
        foreach (['movie', 'series'] as $type) {
            $raw = self::omdbGet(['s' => $query, 'type' => $type]);
            if ($raw && ($raw['Response'] ?? '') === 'True' && !empty($raw['Search'])) {
                foreach (array_slice($raw['Search'], 0, 5) as $item) {
                    $results[] = [
                        'imdb_id'      => $item['imdbID'],
                        'titulo'       => $item['Title'],
                        'ano'          => $item['Year'] ?? null,
                        'tipo_omdb'    => $item['Type'] ?? $type,
                        'poster_url'   => ($item['Poster'] ?? 'N/A') !== 'N/A' ? $item['Poster'] : null,
                    ];
                }
            }
        }

        return $results;
    }

    // ── Busca dados completos ─────────────────────────────────────
    public static function fetch($imdbId)
    {
        $raw = self::omdbGet(['i' => $imdbId, 'plot' => 'full']);
        if (!$raw || ($raw['Response'] ?? '') === 'False') return null;

        $tipo = match(strtolower($raw['Type'] ?? 'movie')) {
            'series' => 'serie',
            default  => 'filme',
        };

        $sinopseOrig = $raw['Plot'] ?? '';
        $sinopseTrad = self::translate($sinopseOrig, 'en', 'pt');

        $elenco = [];
        foreach (explode(',', $raw['Actors'] ?? '') as $a) {
            $n = trim($a);
            if ($n) $elenco[] = ['nome' => $n, 'personagem' => ''];
        }

        $nota = null;
        foreach ($raw['Ratings'] ?? [] as $r) {
            if ($r['Source'] === 'Internet Movie Database') {
                $nota = (float) explode('/', $r['Value'])[0];
            }
        }

        $generos = array_map('trim', explode(',', $raw['Genre'] ?? ''));
        $totalTemporadas = isset($raw['totalSeasons']) ? (int)$raw['totalSeasons'] : 0;

        return [
            'imdb_id'          => $imdbId,
            'titulo'           => $raw['Title']    ?? '',
            'titulo_original'  => $raw['Title']    ?? '',
            'sinopse'          => $sinopseTrad     ?: $sinopseOrig,
            'sinopse_original' => $sinopseOrig,
            'ano'              => is_numeric($raw['Year'] ?? '') ? (int)$raw['Year'] : null,
            'duracao_min'      => self::parseRuntime($raw['Runtime'] ?? ''),
            'classificacao'    => $raw['Rated']    ?? null,
            'nota_imdb'        => $nota,
            'diretor'          => $raw['Director'] ?? null,
            'criadores'        => $raw['Writer']   ?? null,
            'elenco'           => $elenco,
            'generos'          => $generos,
            'poster_url'       => ($raw['Poster'] ?? 'N/A') !== 'N/A' ? $raw['Poster'] : null,
            'backdrop_url'     => null,
            'trailer_youtube'  => null,
            'tipo'             => $tipo,
            'total_temporadas' => $totalTemporadas,
        ];
    }

    // ── Busca temporadas e episódios ──────────────────────────────
    public static function fetchTemporadas($imdbId)
    {
        // Primeiro pega o total de temporadas
        $base = self::omdbGet(['i' => $imdbId]);
        if (!$base || ($base['Response'] ?? '') === 'False') return [];

        $totalSeasons = isset($base['totalSeasons']) ? (int)$base['totalSeasons'] : 1;
        $temporadas = [];

        for ($s = 1; $s <= $totalSeasons; $s++) {
            $raw = self::omdbGet(['i' => $imdbId, 'Season' => $s]);
            if (!$raw || ($raw['Response'] ?? '') === 'False') continue;

            $episodios = [];
            foreach ($raw['Episodes'] ?? [] as $ep) {
                $titulo = $ep['Title'] ?? "Episódio {$ep['Episode']}";
                $episodios[] = [
                    'numero'         => (int)($ep['Episode'] ?? 0),
                    'imdb_episode_id'=> $ep['imdbID'] ?? null,
                    'titulo'         => self::translate($titulo, 'en', 'pt') ?: $titulo,
                    'sinopse'        => '',
                    'nota_imdb'      => is_numeric($ep['imdbRating'] ?? '') ? (float)$ep['imdbRating'] : null,
                ];
            }

            $temporadas[] = [
                'numero'    => $s,
                'titulo'    => "Temporada $s",
                'episodios' => $episodios,
            ];
        }

        return $temporadas;
    }

    // ── Busca episódio individual ─────────────────────────────────
    public static function fetchEpisodio($epImdbId)
    {
        $raw = self::omdbGet(['i' => $epImdbId, 'plot' => 'full']);
        if (!$raw || ($raw['Response'] ?? '') === 'False') return null;

        $titulo  = $raw['Title']  ?? '';
        $sinopse = $raw['Plot']   ?? '';

        return [
            'imdb_episode_id' => $epImdbId,
            'titulo'          => self::translate($titulo, 'en', 'pt')  ?: $titulo,
            'sinopse'         => self::translate($sinopse, 'en', 'pt') ?: $sinopse,
            'duracao_min'     => self::parseRuntime($raw['Runtime'] ?? ''),
        ];
    }

    // ── OMDb request ──────────────────────────────────────────────
    private static function omdbGet($params)
    {
        $params['apikey'] = self::OMDB_KEY;
        $url = self::OMDB_URL . '?' . http_build_query($params);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => self::TIMEOUT,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT      => 'Splitflix/1.0',
        ]);
        $response = curl_exec($ch);
        curl_close($ch);

        if (!$response) return null;
        $data = json_decode($response, true);
        return is_array($data) ? $data : null;
    }

    // ── Google Translate (mantido conforme solicitado) ────────────
    private static function translate($text, $from, $to)
    {
        if (empty(trim($text)) || strlen($text) > 5000) return $text;
        $url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' . $from . '&tl=' . $to . '&dt=t&q=' . urlencode($text);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT      => 'Mozilla/5.0',
        ]);
        $resp = curl_exec($ch);
        curl_close($ch);

        if (!$resp) return $text;
        $data = json_decode($resp, true);
        if (is_array($data) && isset($data[0])) {
            $translated = '';
            foreach ($data[0] as $phrase) {
                $translated .= $phrase[0] ?? '';
            }
            return $translated ?: $text;
        }
        return $text;
    }

    private static function parseRuntime($runtime)
    {
        preg_match('/(\d+)/', $runtime, $m);
        return isset($m[1]) ? (int)$m[1] : null;
    }
}
