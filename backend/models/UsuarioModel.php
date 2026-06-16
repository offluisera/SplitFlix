<?php
/**
 * Splitflix — Model: Usuario
 */



require_once BASE_PATH . '/models/BaseModel.php';

class UsuarioModel extends BaseModel
{
    protected string $table = 'usuarios';

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM usuarios WHERE email = ? LIMIT 1"
        );
        $stmt->execute([strtolower(trim($email))]);
        return $stmt->fetch() ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO usuarios (nome, email, senha_hash, papel, status, email_verificado, token_verificacao, ip_cadastro)
            VALUES (:nome, :email, :senha_hash, :papel, :status, :email_verificado, :token_verificacao, :ip_cadastro)
        ");
        $stmt->execute([
            ':nome'              => $data['nome'],
            ':email'             => strtolower($data['email']),
            ':senha_hash'        => password_hash($data['senha'], PASSWORD_BCRYPT, ['cost' => 12]),
            ':papel'             => $data['papel']             ?? 'usuario',
            ':status'            => $data['status']            ?? 'ativo',
            ':email_verificado'  => $data['email_verificado']  ?? 0,
            ':token_verificacao' => $data['token_verificacao'] ?? null,
            ':ip_cadastro'       => $data['ip']                ?? null,
        ]);
        return $this->lastInsertId();
    }

    public function updateRefreshToken(int $id, ?string $hashedToken, ?string $expiry): void
    {
        $stmt = $this->db->prepare("
            UPDATE usuarios SET refresh_token = ?, refresh_token_expira_em = ?, ultimo_login = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$hashedToken, $expiry, $id]);
    }

    public function updateLastLogin(int $id): void
    {
        $stmt = $this->db->prepare("UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?");
        $stmt->execute([$id]);
    }

    public function findByRefreshToken(string $hashedToken): ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM usuarios
            WHERE refresh_token = ? AND refresh_token_expira_em > NOW() AND status = 'ativo'
            LIMIT 1
        ");
        $stmt->execute([$hashedToken]);
        return $stmt->fetch() ?: null;
    }

    public function updatePerfil(int $id, array $data): void
    {
        $fields = [];
        $params = [];
        $allowed = ['nome', 'avatar'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "$f = ?";
                $params[] = $data[$f];
            }
        }
        if (empty($fields)) return;
        $params[] = $id;
        $this->db->prepare("UPDATE usuarios SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
    }

    public function updateStatus(int $id, string $status): void
    {
        $stmt = $this->db->prepare("UPDATE usuarios SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
    }

    public function adminList(int $page, int $perPage, string $search = ''): array
    {
        $params = [];
        $where  = '';
        if ($search) {
            $where   = "WHERE nome LIKE ? OR email LIKE ?";
            $params  = ["%$search%", "%$search%"];
        }
        return $this->paginate(
            "SELECT id, nome, email, papel, status, ultimo_login, criado_em FROM usuarios $where ORDER BY criado_em DESC",
            $params, $page, $perPage
        );
    }

    /** Retorna usuário sem campos sensíveis */
    public function publicProfile(array $user): array
    {
        unset($user['senha_hash'], $user['refresh_token'], $user['refresh_token_expira_em'], $user['token_verificacao']);
        return $user;
    }

    public function countNewToday(): int
    {
        return (int) $this->db->query("SELECT COUNT(*) FROM usuarios WHERE DATE(criado_em) = CURDATE()")->fetchColumn();
    }

    public function countNewThisWeek(): int
    {
        return (int) $this->db->query("SELECT COUNT(*) FROM usuarios WHERE criado_em >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn();
    }
}
