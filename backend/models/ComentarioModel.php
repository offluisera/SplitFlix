<?php
/**
 * Splitflix — Model: Comentario (v2)
 * Adiciona campo `nota` e método adminDelete
 */

require_once BASE_PATH . '/models/BaseModel.php';

class ComentarioModel extends BaseModel
{
    protected string $table = 'comentarios';

    public function byConteudo(string $tipo, int $id, int $page, int $perPage): array
    {
        return $this->paginate(
            "SELECT
                c.id, c.texto, c.nota, c.parent_id,
                COALESCE(c.criado_em, c.created_at) AS criado_em,
                u.id     AS usuario_id,
                u.nome   AS usuario_nome,
                u.avatar AS usuario_avatar
             FROM comentarios c
             JOIN usuarios u ON u.id = c.usuario_id
             WHERE c.conteudo_tipo=? AND c.conteudo_id=? AND c.status='aprovado'
             ORDER BY c.id DESC",
            [$tipo, $id], $page, $perPage
        );
    }

    public function create(array $data): int
    {
        // Admins publicam direto; demais ficam pendentes
        $status = ($data['papel'] ?? 'usuario') === 'admin' ? 'aprovado' : 'pendente';

        $stmt = $this->db->prepare("
            INSERT INTO comentarios
                (usuario_id, conteudo_tipo, conteudo_id, parent_id, texto, nota, status, ip, user_agent)
            VALUES
                (:usuario_id, :conteudo_tipo, :conteudo_id, :parent_id, :texto, :nota, :status, :ip, :ua)
        ");
        $stmt->execute([
            ':usuario_id'    => $data['usuario_id'],
            ':conteudo_tipo' => $data['conteudo_tipo'],
            ':conteudo_id'   => $data['conteudo_id'],
            ':parent_id'     => $data['parent_id'] ?? null,
            ':texto'         => $data['texto'],
            ':nota'          => $data['nota'] ?? null,
            ':status'        => $status,
            ':ip'            => $data['ip']         ?? null,
            ':ua'            => $data['user_agent'] ?? null,
        ]);
        return $this->lastInsertId();
    }

    public function updateStatus(int $id, string $status): void
    {
        $this->db->prepare("UPDATE comentarios SET status=? WHERE id=?")->execute([$status, $id]);
    }

    /** Usuário comum só apaga o próprio; admin/moderador apaga qualquer */
    public function delete(int $id, int $usuarioId, string $papel): bool
    {
        if (in_array($papel, ['admin', 'moderador'], true)) {
            return (bool)$this->db->prepare("DELETE FROM comentarios WHERE id=?")->execute([$id]);
        }
        return (bool)$this->db->prepare("DELETE FROM comentarios WHERE id=? AND usuario_id=?")->execute([$id, $usuarioId]);
    }

    /** Delete direto pelo admin (sem checar owner) */
    public function adminDelete(int $id): void
    {
        $this->db->prepare("DELETE FROM comentarios WHERE id=?")->execute([$id]);
    }

    public function adminList(int $page, int $perPage, string $status = ''): array
    {
        $where  = $status ? "WHERE c.status=?" : '';
        $params = $status ? [$status] : [];
        return $this->paginate(
            "SELECT
                c.id, c.texto, c.nota, c.status,
                COALESCE(c.criado_em, c.created_at) AS criado_em,
                c.conteudo_tipo, c.conteudo_id,
                u.id   AS usuario_id,
                u.nome AS usuario_nome
             FROM comentarios c
             JOIN usuarios u ON u.id = c.usuario_id
             $where
             ORDER BY c.id DESC",
            $params, $page, $perPage
        );
    }

    public function pendingCount(): int
    {
        return (int)$this->db->query("SELECT COUNT(*) FROM comentarios WHERE status='pendente'")->fetchColumn();
    }
}