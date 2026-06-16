<?php
/**
 * Splitflix — Model: Filme
 */



require_once BASE_PATH . '/models/BaseModel.php';

class FilmeModel extends BaseModel
{
    protected string $table = 'filmes';

    // ── Listagem pública ──────────────────────────────────────────

    public function publicList(int $page, int $perPage, array $filters = []): array
    {
        [$where, $params] = $this->buildFilters($filters, 'publicado');
        return $this->paginate(
            "SELECT id, titulo, slug, ano, nota_imdb, nota_usuarios, poster_url, backdrop_url, duracao_min, destaque, visualizacoes, 'filme' AS tipo
             FROM filmes $where ORDER BY criado_em DESC",
            $params, $page, $perPage
        );
    }

    public function emAlta(int $limit = 12): array
    {
        $stmt = $this->db->prepare("
            SELECT id, titulo, slug, ano, nota_imdb, poster_url, backdrop_url, visualizacoes, 'filme' AS tipo
            FROM filmes WHERE status = 'publicado' AND em_alta = 1
            ORDER BY visualizacoes DESC LIMIT ?
        ");
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }

    public function destaques(int $limit = 5): array
    {
        $stmt = $this->db->prepare("
            SELECT id, titulo, slug, sinopse, ano, nota_imdb, poster_url, backdrop_url, trailer_youtube, 'filme' AS tipo
            FROM filmes WHERE status = 'publicado' AND destaque = 1
            ORDER BY RAND() LIMIT ?
        ");
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }

    // ── Detalhe público ───────────────────────────────────────────

    public function findBySlug(string $slug): ?array
    {
        $stmt = $this->db->prepare("
            SELECT f.*, GROUP_CONCAT(g.nome ORDER BY g.nome SEPARATOR ', ') AS generos_str,
                   GROUP_CONCAT(g.id ORDER BY g.nome) AS generos_ids
            FROM filmes f
            LEFT JOIN filme_generos fg ON fg.filme_id = f.id
            LEFT JOIN generos g ON g.id = fg.genero_id
            WHERE f.slug = ? AND f.status = 'publicado'
            GROUP BY f.id
            LIMIT 1
        ");
        $stmt->execute([$slug]);
        $row = $stmt->fetch();
        if ($row) {
            $row['elenco'] = $row['elenco'] ? json_decode($row['elenco'], true) : [];
            $this->incrementViews($row['id']);
        }
        return $row ?: null;
    }

    // ── Admin ─────────────────────────────────────────────────────

    public function adminList(int $page, int $perPage, array $filters = []): array
    {
        [$where, $params] = $this->buildFilters($filters);
        return $this->paginate(
            "SELECT id, titulo, slug, ano, status, destaque, em_alta, visualizacoes, criado_em
             FROM filmes $where ORDER BY criado_em DESC",
            $params, $page, $perPage
        );
    }

    public function adminFindById(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT f.*, GROUP_CONCAT(fg.genero_id) AS generos_ids
            FROM filmes f
            LEFT JOIN filme_generos fg ON fg.filme_id = f.id
            WHERE f.id = ?
            GROUP BY f.id
        ");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if ($row) $row['elenco'] = $row['elenco'] ? json_decode($row['elenco'], true) : [];
        return $row ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO filmes (imdb_id, titulo, titulo_original, slug, sinopse, sinopse_original,
                ano, duracao_min, classificacao, nota_imdb, diretor, elenco, poster_url, backdrop_url,
                trailer_youtube, embed_dailymotion, destaque, em_alta, status, criado_por)
            VALUES (:imdb_id, :titulo, :titulo_original, :slug, :sinopse, :sinopse_original,
                :ano, :duracao_min, :classificacao, :nota_imdb, :diretor, :elenco, :poster_url,
                :backdrop_url, :trailer_youtube, :embed_dailymotion, :destaque, :em_alta, :status, :criado_por)
        ");
        $stmt->execute([
            ':imdb_id'          => $data['imdb_id']          ?? null,
            ':titulo'           => $data['titulo'],
            ':titulo_original'  => $data['titulo_original']  ?? null,
            ':slug'             => $data['slug'],
            ':sinopse'          => $data['sinopse']          ?? null,
            ':sinopse_original' => $data['sinopse_original'] ?? null,
            ':ano'              => $data['ano']               ?? null,
            ':duracao_min'      => $data['duracao_min']       ?? null,
            ':classificacao'    => $data['classificacao']     ?? null,
            ':nota_imdb'        => $data['nota_imdb']         ?? null,
            ':diretor'          => $data['diretor']           ?? null,
            ':elenco'           => isset($data['elenco']) ? json_encode($data['elenco'], JSON_UNESCAPED_UNICODE) : null,
            ':poster_url'       => $data['poster_url']        ?? null,
            ':backdrop_url'     => $data['backdrop_url']      ?? null,
            ':trailer_youtube'  => $data['trailer_youtube']   ?? null,
            ':embed_dailymotion'=> $data['embed_dailymotion'] ?? null,
            ':destaque'         => (int) ($data['destaque']   ?? 0),
            ':em_alta'          => (int) ($data['em_alta']    ?? 0),
            ':status'           => $data['status']            ?? 'rascunho',
            ':criado_por'       => $data['criado_por']        ?? null,
        ]);
        $id = $this->lastInsertId();
        if (!empty($data['generos'])) $this->syncGeneros($id, $data['generos']);
        return $id;
    }

    public function update(int $id, array $data): void
    {
        $fields = [];
        $params = [];
        $allowed = ['titulo','titulo_original','slug','sinopse','ano','duracao_min','classificacao',
                    'nota_imdb','diretor','poster_url','backdrop_url','trailer_youtube',
                    'embed_dailymotion','destaque','em_alta','status'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "$f = ?";
                $params[] = $data[$f];
            }
        }
        if (isset($data['elenco'])) {
            $fields[] = "elenco = ?";
            $params[] = json_encode($data['elenco'], JSON_UNESCAPED_UNICODE);
        }
        if (empty($fields)) return;
        $params[] = $id;
        $this->db->prepare("UPDATE filmes SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        if (isset($data['generos'])) $this->syncGeneros($id, $data['generos']);
    }

    public function delete(int $id): void
    {
        $this->db->prepare("DELETE FROM filmes WHERE id = ?")->execute([$id]);
    }

    public function slugExists(string $slug, ?int $excludeId = null): bool
    {
        $sql    = "SELECT 1 FROM filmes WHERE slug = ?";
        $params = [$slug];
        if ($excludeId) { $sql .= " AND id != ?"; $params[] = $excludeId; }
        return (bool) $this->db->prepare($sql)->execute($params) && (bool) $this->db->prepare($sql)->fetchColumn();
    }

    public function count(): int
    {
        return (int) $this->db->query("SELECT COUNT(*) FROM filmes WHERE status='publicado'")->fetchColumn();
    }

    // ── Gêneros ───────────────────────────────────────────────────

    private function syncGeneros(int $filmeId, array $generoIds): void
    {
        $this->db->prepare("DELETE FROM filme_generos WHERE filme_id = ?")->execute([$filmeId]);
        $stmt = $this->db->prepare("INSERT IGNORE INTO filme_generos (filme_id, genero_id) VALUES (?, ?)");
        foreach ($generoIds as $gid) {
            $stmt->execute([$filmeId, (int) $gid]);
        }
    }

    // ── Views ─────────────────────────────────────────────────────

    private function incrementViews(int $id): void
    {
        $this->db->prepare("UPDATE filmes SET visualizacoes = visualizacoes + 1 WHERE id = ?")->execute([$id]);
    }

    // ── Busca FULLTEXT ────────────────────────────────────────────

    public function search(string $q, int $limit = 20): array
    {
        $stmt = $this->db->prepare("
            SELECT id, titulo, slug, ano, nota_imdb, poster_url, 'filme' AS tipo
            FROM filmes
            WHERE status = 'publicado' AND MATCH(titulo, sinopse) AGAINST(? IN BOOLEAN MODE)
            LIMIT ?
        ");
        $stmt->execute([$q . '*', $limit]);
        return $stmt->fetchAll();
    }

    // ── Filtros ───────────────────────────────────────────────────

    private function buildFilters(array $filters, ?string $statusDefault = null): array
    {
        $conditions = [];
        $params     = [];
        if ($statusDefault) { $conditions[] = "status = ?"; $params[] = $statusDefault; }
        if (!empty($filters['status']))  { $conditions[] = "status = ?";  $params[] = $filters['status']; }
        if (!empty($filters['ano']))     { $conditions[] = "ano = ?";     $params[] = (int) $filters['ano']; }
        if (!empty($filters['genero']))  {
            $conditions[] = "id IN (SELECT filme_id FROM filme_generos fg JOIN generos g ON g.id=fg.genero_id WHERE g.slug=?)";
            $params[]      = $filters['genero'];
        }
        $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';
        return [$where, $params];
    }
}
