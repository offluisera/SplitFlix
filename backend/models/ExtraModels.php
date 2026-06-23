<?php
/**
 * Splitflix — Model: Avaliacao (v2 — com comentário, lista pública)
 */

require_once BASE_PATH . '/models/BaseModel.php';

class AvaliacaoModel extends BaseModel
{
    protected string $table = 'avaliacoes';

    public function upsert(int $usuarioId, string $tipo, int $conteudoId, int $nota, ?string $comentario = null): void
    {
        // Tenta INSERT; se já existe (UNIQUE usuario+tipo+conteudo), atualiza
        $stmt = $this->db->prepare("
            INSERT INTO avaliacoes (usuario_id, conteudo_tipo, conteudo_id, nota, comentario)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                nota        = VALUES(nota),
                comentario  = VALUES(comentario),
                atualizado_em = NOW()
        ");
        $stmt->execute([$usuarioId, $tipo, $conteudoId, $nota, $comentario]);
        $this->recalcMedia($tipo, $conteudoId);
    }

    public function userNote(int $usuarioId, string $tipo, int $conteudoId): ?int
    {
        $stmt = $this->db->prepare(
            "SELECT nota FROM avaliacoes WHERE usuario_id=? AND conteudo_tipo=? AND conteudo_id=? LIMIT 1"
        );
        $stmt->execute([$usuarioId, $tipo, $conteudoId]);
        $r = $stmt->fetchColumn();
        return $r !== false ? (int)$r : null;
    }

    public function userReview(int $usuarioId, string $tipo, int $conteudoId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT nota, comentario FROM avaliacoes WHERE usuario_id=? AND conteudo_tipo=? AND conteudo_id=? LIMIT 1"
        );
        $stmt->execute([$usuarioId, $tipo, $conteudoId]);
        $r = $stmt->fetch();
        return $r ?: null;
    }

    public function stats(string $tipo, int $conteudoId): array
    {
        $stmt = $this->db->prepare(
            "SELECT AVG(nota) AS media, COUNT(*) AS total FROM avaliacoes WHERE conteudo_tipo=? AND conteudo_id=?"
        );
        $stmt->execute([$tipo, $conteudoId]);
        return $stmt->fetch();
    }

    /**
     * Lista avaliações com nome e avatar do usuário.
     * Usa COALESCE para garantir que criado_em sempre exista
     * (algumas versões do schema usam created_at).
     */
    public function listByConteudo(string $tipo, int $conteudoId, int $page = 1, int $perPage = 10): array
    {
        return $this->paginate(
            "SELECT
                a.id,
                a.nota,
                a.comentario,
                COALESCE(a.criado_em, a.created_at, NOW()) AS criado_em,
                u.id   AS usuario_id,
                u.nome AS usuario_nome,
                u.avatar AS usuario_avatar
             FROM avaliacoes a
             INNER JOIN usuarios u ON u.id = a.usuario_id
             WHERE a.conteudo_tipo = ? AND a.conteudo_id = ?
               AND a.comentario IS NOT NULL AND a.comentario <> ''
             ORDER BY a.id DESC",
            [$tipo, $conteudoId], $page, $perPage
        );
    }

    private function recalcMedia(string $tipo, int $id): void
    {
        $tbl = match($tipo) {
            'filme' => 'filmes',
            'serie' => 'series',
            'anime' => 'animes',
            default => 'filmes',
        };
        $this->db->prepare("
            UPDATE {$tbl} SET
                nota_usuarios    = (SELECT AVG(nota)   FROM avaliacoes WHERE conteudo_tipo=? AND conteudo_id=?),
                total_avaliacoes = (SELECT COUNT(*)     FROM avaliacoes WHERE conteudo_tipo=? AND conteudo_id=?)
            WHERE id = ?
        ")->execute([$tipo, $id, $tipo, $id, $id]);
    }
}

// ================================================================

class AnuncioModel extends BaseModel
{
    protected string $table = 'anuncios';

    public function byPosicao(string $posicao, string $tipo = 'todos'): array
    {
        $hoje = date('Y-m-d');
        $stmt = $this->db->prepare("
            SELECT id, nome, codigo_html, posicao, prioridade
            FROM anuncios
            WHERE posicao=? AND status=1
              AND (data_inicio IS NULL OR data_inicio <= ?)
              AND (data_fim   IS NULL OR data_fim   >= ?)
              AND (FIND_IN_SET(?, tipo_conteudo) OR FIND_IN_SET('todos', tipo_conteudo))
            ORDER BY prioridade ASC LIMIT 3
        ");
        $stmt->execute([$posicao, $hoje, $hoje, $tipo]);
        return $stmt->fetchAll();
    }

    public function list(int $page, int $perPage): array
    {
        return $this->paginate("SELECT * FROM anuncios ORDER BY posicao, prioridade", [], $page, $perPage);
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO anuncios (nome,codigo_html,posicao,tipo_conteudo,status,prioridade,data_inicio,data_fim,criado_por)
            VALUES (?,?,?,?,?,?,?,?,?)
        ");
        $stmt->execute([
            $data['nome'], $data['codigo_html'], $data['posicao'],
            $data['tipo_conteudo'] ?? 'todos', $data['status'] ?? 1,
            $data['prioridade'] ?? 5, $data['data_inicio'] ?? null,
            $data['data_fim'] ?? null, $data['criado_por'] ?? null,
        ]);
        return $this->lastInsertId();
    }

    public function update(int $id, array $data): void
    {
        $fields = []; $params = [];
        foreach (['nome','codigo_html','posicao','tipo_conteudo','status','prioridade','data_inicio','data_fim'] as $f) {
            if (array_key_exists($f, $data)) { $fields[] = "$f=?"; $params[] = $data[$f]; }
        }
        if (empty($fields)) return;
        $params[] = $id;
        $this->db->prepare("UPDATE anuncios SET " . implode(',', $fields) . " WHERE id=?")->execute($params);
    }

    public function toggle(int $id): array
    {
        $this->db->prepare("UPDATE anuncios SET status = !status WHERE id=?")->execute([$id]);
        $stmt = $this->db->prepare("SELECT status FROM anuncios WHERE id=?");
        $stmt->execute([$id]);
        return ['status' => (int)$stmt->fetchColumn()];
    }

    public function delete(int $id): void
    {
        $this->db->prepare("DELETE FROM anuncios WHERE id=?")->execute([$id]);
    }

    public function incrementImpressao(int $id): void
    {
        $this->db->prepare("UPDATE anuncios SET impressoes=impressoes+1 WHERE id=?")->execute([$id]);
    }
}

// ================================================================

class AcessoModel extends BaseModel
{
    protected string $table = 'acessos';

    public function record(array $data): void
    {
        $stmt = $this->db->prepare(
            "INSERT INTO acessos (conteudo_tipo,conteudo_id,usuario_id,ip,user_agent,referer) VALUES (?,?,?,?,?,?)"
        );
        $stmt->execute([
            $data['tipo']       ?? 'outro',
            $data['conteudo_id'] ?? null,
            $data['usuario_id']  ?? null,
            $data['ip']          ?? null,
            isset($data['ua'])       ? substr($data['ua'], 0, 490)      : null,
            isset($data['referer'])  ? substr($data['referer'], 0, 490) : null,
        ]);
    }

    public function totalHoje(): int
    {
        return (int)$this->db->query("SELECT COUNT(*) FROM acessos WHERE DATE(criado_em)=CURDATE()")->fetchColumn();
    }

    public function totalSemana(): int
    {
        return (int)$this->db->query("SELECT COUNT(*) FROM acessos WHERE criado_em>=DATE_SUB(NOW(),INTERVAL 7 DAY)")->fetchColumn();
    }

    public function porDia(int $dias = 30): array
    {
        $stmt = $this->db->prepare(
            "SELECT DATE(criado_em) AS dia, COUNT(*) AS total FROM acessos WHERE criado_em>=DATE_SUB(NOW(),INTERVAL ? DAY) GROUP BY dia ORDER BY dia ASC"
        );
        $stmt->execute([$dias]);
        return $stmt->fetchAll();
    }
}

// ================================================================

class ProgressoModel extends BaseModel
{
    protected string $table = 'progresso';

    public function upsert(int $usuarioId, string $tipo, int $conteudoId, int $posicaoSeg, ?int $duracaoSeg = null): void
    {
        $concluido = ($duracaoSeg && $posicaoSeg >= $duracaoSeg * 0.9) ? 1 : 0;
        $this->db->prepare("
            INSERT INTO progresso (usuario_id,conteudo_tipo,conteudo_id,posicao_seg,duracao_seg,concluido)
            VALUES (?,?,?,?,?,?)
            ON DUPLICATE KEY UPDATE
                posicao_seg = VALUES(posicao_seg),
                duracao_seg = VALUES(duracao_seg),
                concluido   = VALUES(concluido)
        ")->execute([$usuarioId, $tipo, $conteudoId, $posicaoSeg, $duracaoSeg, $concluido]);
    }

    public function continueWatching(int $usuarioId, int $limit = 10): array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM progresso WHERE usuario_id=? AND concluido=0 ORDER BY atualizado_em DESC LIMIT ?"
        );
        $stmt->execute([$usuarioId, $limit]);
        return $stmt->fetchAll();
    }
}