<?php
/**
 * Splitflix — Model Base
 * Todos os models herdam desta classe.
 */



abstract class BaseModel
{
    protected PDO $db;
    protected string $table;
    protected string $primaryKey = 'id';

    public function __construct()
    {
        $this->db = Database::pdo();
    }

    // ── Busca por ID ──────────────────────────────────────────────

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM `{$this->table}` WHERE `{$this->primaryKey}` = ? LIMIT 1"
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    // ── Paginação genérica ────────────────────────────────────────

    protected function paginate(
        string $sql,
        array  $params,
        int    $page,
        int    $perPage,
        string $countSql = ''
    ): array {
        $page    = max(1, $page);
        $perPage = min(max(1, $perPage), MAX_PAGE_SIZE);
        $offset  = ($page - 1) * $perPage;

        // Count total
        if ($countSql) {
            $stmtCount = $this->db->prepare($countSql);
            $stmtCount->execute($params);
            $total = (int) $stmtCount->fetchColumn();
        } else {
            // Tenta extrair automaticamente
            $countQuery = preg_replace('/SELECT .+? FROM/is', 'SELECT COUNT(*) FROM', $sql);
            $countQuery = preg_replace('/ORDER BY .+$/is', '', $countQuery);
            $stmtCount  = $this->db->prepare($countQuery);
            $stmtCount->execute($params);
            $total = (int) $stmtCount->fetchColumn();
        }

        // Dados paginados
        $stmt = $this->db->prepare($sql . " LIMIT ? OFFSET ?");
        $executeParams = array_merge($params, [$perPage, $offset]); $stmt->execute($executeParams);
        $items = $stmt->fetchAll();

        return compact('items', 'total', 'page', 'perPage');
    }

    // ── Soft helpers ─────────────────────────────────────────────

    protected function exists(int $id): bool
    {
        $stmt = $this->db->prepare(
            "SELECT 1 FROM `{$this->table}` WHERE `{$this->primaryKey}` = ? LIMIT 1"
        );
        $stmt->execute([$id]);
        return (bool) $stmt->fetchColumn();
    }

    protected function lastInsertId(): int
    {
        return (int) $this->db->lastInsertId();
    }
}
