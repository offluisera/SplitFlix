<?php
/**
 * Splitflix — Model: Episodio + Temporada
 */



require_once BASE_PATH . '/models/BaseModel.php';

class EpisodioModel extends BaseModel
{
    protected string $table = 'episodios';

    // ── Episódios ─────────────────────────────────────────────────

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT e.*, t.numero AS temporada_numero, t.conteudo_id, t.conteudo_tipo,
                   t.titulo AS temporada_titulo
            FROM episodios e
            JOIN temporadas t ON t.id = e.temporada_id
            WHERE e.id = ? AND e.status = 'publicado'
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if ($row) {
            $this->db->prepare("UPDATE episodios SET visualizacoes = visualizacoes + 1 WHERE id=?")->execute([$id]);
        }
        return $row ?: null;
    }

    public function byTemporada(int $temporadaId): array
    {
        $stmt = $this->db->prepare("
            SELECT id, numero, titulo, sinopse, duracao_min, thumbnail_url, embed_dailymotion, visualizacoes
            FROM episodios WHERE temporada_id=? AND status='publicado' ORDER BY numero ASC
        ");
        $stmt->execute([$temporadaId]);
        return $stmt->fetchAll();
    }

    public function adminByTemporada(int $temporadaId): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM episodios WHERE temporada_id=? ORDER BY numero ASC
        ");
        $stmt->execute([$temporadaId]);
        return $stmt->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO episodios (temporada_id, numero, imdb_episode_id, titulo, sinopse,
                duracao_min, thumbnail_url, embed_dailymotion, dailymotion_video_id, status)
            VALUES (:temporada_id,:numero,:imdb_episode_id,:titulo,:sinopse,
                :duracao_min,:thumbnail_url,:embed_dailymotion,:dailymotion_video_id,:status)
        ");
        $embed = $data['embed_dailymotion'] ?? '';
        preg_match('/\/video\/([a-zA-Z0-9]+)/', $embed, $m);
        $videoId = $m[1] ?? null;

        $stmt->execute([
            ':temporada_id'       => $data['temporada_id'],
            ':numero'             => $data['numero'],
            ':imdb_episode_id'    => $data['imdb_episode_id']  ?? null,
            ':titulo'             => $data['titulo'],
            ':sinopse'            => $data['sinopse']          ?? null,
            ':duracao_min'        => $data['duracao_min']       ?? null,
            ':thumbnail_url'      => $data['thumbnail_url']     ?? null,
            ':embed_dailymotion'  => $embed,
            ':dailymotion_video_id'=> $videoId,
            ':status'             => $data['status']            ?? 'rascunho',
        ]);
        $id = $this->lastInsertId();
        $this->updateTemporadaCount($data['temporada_id']);
        return $id;
    }

    public function update(int $id, array $data): void
    {
        $fields=[]; $params=[];
        $allowed=['numero','titulo','sinopse','duracao_min','thumbnail_url','embed_dailymotion','status'];
        foreach($allowed as $f){ if(array_key_exists($f,$data)){ $fields[]="$f=?"; $params[]=$data[$f]; } }
        if(isset($data['embed_dailymotion'])){
            preg_match('/\/video\/([a-zA-Z0-9]+)/',$data['embed_dailymotion'],$m);
            $fields[]="dailymotion_video_id=?"; $params[]=$m[1]??null;
        }
        if(empty($fields)) return;
        $params[]=$id;
        $this->db->prepare("UPDATE episodios SET ".implode(',',$fields)." WHERE id=?")->execute($params);
    }

    public function delete(int $id): void
    {
        $row = $this->db->prepare("SELECT temporada_id FROM episodios WHERE id=?")->execute([$id]) ? null : null;
        $stmt= $this->db->prepare("SELECT temporada_id FROM episodios WHERE id=?");
        $stmt->execute([$id]);
        $ep = $stmt->fetch();
        $this->db->prepare("DELETE FROM episodios WHERE id=?")->execute([$id]);
        if($ep) $this->updateTemporadaCount((int)$ep['temporada_id']);
    }

    public function totalCount(): int
    {
        return (int)$this->db->query("SELECT COUNT(*) FROM episodios WHERE status='publicado'")->fetchColumn();
    }

    private function updateTemporadaCount(int $temporadaId): void
    {
        $this->db->prepare("UPDATE temporadas SET total_episodios=(SELECT COUNT(*) FROM episodios WHERE temporada_id=? AND status='publicado') WHERE id=?")->execute([$temporadaId,$temporadaId]);
    }

    // ── Temporadas ────────────────────────────────────────────────

    public function getTemporadasAdmin(int $conteudoId, string $tipo): array
    {
        $stmt=$this->db->prepare("
            SELECT t.*, COUNT(e.id) AS total_eps
            FROM temporadas t LEFT JOIN episodios e ON e.temporada_id=t.id
            WHERE t.conteudo_id=? AND t.conteudo_tipo=?
            GROUP BY t.id ORDER BY t.numero ASC
        ");
        $stmt->execute([$conteudoId,$tipo]);
        return $stmt->fetchAll();
    }

    public function createTemporada(array $data): int
    {
        $stmt=$this->db->prepare("
            INSERT INTO temporadas (conteudo_id,conteudo_tipo,numero,titulo,sinopse,ano,poster_url)
            VALUES (:conteudo_id,:conteudo_tipo,:numero,:titulo,:sinopse,:ano,:poster_url)
        ");
        $stmt->execute([
            ':conteudo_id'  =>$data['conteudo_id'],
            ':conteudo_tipo'=>$data['conteudo_tipo'],
            ':numero'       =>$data['numero'],
            ':titulo'       =>$data['titulo']??null,
            ':sinopse'      =>$data['sinopse']??null,
            ':ano'          =>$data['ano']??null,
            ':poster_url'   =>$data['poster_url']??null,
        ]);
        return $this->lastInsertId();
    }

    public function updateTemporada(int $id, array $data): void
    {
        $fields=[]; $params=[];
        foreach(['numero','titulo','sinopse','ano','poster_url'] as $f){
            if(array_key_exists($f,$data)){ $fields[]="$f=?"; $params[]=$data[$f]; }
        }
        if(empty($fields)) return;
        $params[]=$id;
        $this->db->prepare("UPDATE temporadas SET ".implode(',',$fields)." WHERE id=?")->execute($params);
    }

    public function deleteTemporada(int $id): void
    {
        $this->db->prepare("DELETE FROM temporadas WHERE id=?")->execute([$id]);
    }
}
