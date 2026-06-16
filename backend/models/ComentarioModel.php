<?php
/**
 * Splitflix — Model: Comentario
 */



require_once BASE_PATH . '/models/BaseModel.php';

class ComentarioModel extends BaseModel
{
    protected string $table = 'comentarios';

    public function byConteudo(string $tipo, int $id, int $page, int $perPage): array
    {
        return $this->paginate(
            "SELECT c.id, c.texto, c.parent_id, c.criado_em,
                    u.id AS usuario_id, u.nome AS usuario_nome, u.avatar AS usuario_avatar
             FROM comentarios c
             JOIN usuarios u ON u.id = c.usuario_id
             WHERE c.conteudo_tipo=? AND c.conteudo_id=? AND c.status='aprovado'
             ORDER BY c.criado_em DESC",
            [$tipo, $id], $page, $perPage
        );
    }

    public function create(array $data): int
    {
        // Novos usuários entram como 'pendente'; admins aprovam direto
        $status = ($data['papel'] ?? 'usuario') === 'admin' ? 'aprovado' : 'pendente';
        $stmt = $this->db->prepare("
            INSERT INTO comentarios (usuario_id, conteudo_tipo, conteudo_id, parent_id, texto, status, ip, user_agent)
            VALUES (:usuario_id,:conteudo_tipo,:conteudo_id,:parent_id,:texto,:status,:ip,:ua)
        ");
        $stmt->execute([
            ':usuario_id'   => $data['usuario_id'],
            ':conteudo_tipo'=> $data['conteudo_tipo'],
            ':conteudo_id'  => $data['conteudo_id'],
            ':parent_id'    => $data['parent_id'] ?? null,
            ':texto'        => $data['texto'],
            ':status'       => $status,
            ':ip'           => $data['ip'] ?? null,
            ':ua'           => $data['user_agent'] ?? null,
        ]);
        return $this->lastInsertId();
    }

    public function updateStatus(int $id, string $status): void
    {
        $this->db->prepare("UPDATE comentarios SET status=? WHERE id=?")->execute([$status, $id]);
    }

    public function delete(int $id, int $usuarioId, string $papel): bool
    {
        if ($papel === 'admin') {
            return (bool) $this->db->prepare("DELETE FROM comentarios WHERE id=?")->execute([$id]);
        }
        return (bool) $this->db->prepare("DELETE FROM comentarios WHERE id=? AND usuario_id=?")->execute([$id, $usuarioId]);
    }

    public function adminList(int $page, int $perPage, string $status = ''): array
    {
        $where  = $status ? "WHERE c.status=?" : '';
        $params = $status ? [$status] : [];
        return $this->paginate(
            "SELECT c.*, u.nome AS usuario_nome FROM comentarios c JOIN usuarios u ON u.id=c.usuario_id $where ORDER BY c.criado_em DESC",
            $params, $page, $perPage
        );
    }

    public function pendingCount(): int
    {
        return (int)$this->db->query("SELECT COUNT(*) FROM comentarios WHERE status='pendente'")->fetchColumn();
    }
}
