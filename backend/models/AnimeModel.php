<?php
/**
 * Splitflix — Model: Anime
 */



require_once BASE_PATH . '/models/BaseModel.php';

class AnimeModel extends BaseModel
{
    protected string $table = 'animes';

    public function publicList(int $page, int $perPage, array $filters = []): array
    {
        [$where, $params] = $this->buildFilters($filters, 'publicado');
        return $this->paginate(
            "SELECT id, titulo, titulo_original, slug, ano_inicio, nota_imdb, nota_usuarios, poster_url, backdrop_url, destaque, visualizacoes, 'anime' AS tipo
             FROM animes $where ORDER BY criado_em DESC",
            $params, $page, $perPage
        );
    }

    public function emAlta(int $limit = 12): array
    {
        $stmt = $this->db->prepare("SELECT id, titulo, slug, ano_inicio, nota_imdb, poster_url, backdrop_url, 'anime' AS tipo FROM animes WHERE status='publicado' AND em_alta=1 ORDER BY visualizacoes DESC LIMIT ?");
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }

    public function destaques(int $limit = 5): array
    {
        $stmt = $this->db->prepare("SELECT id, titulo, slug, sinopse, ano_inicio AS ano, nota_imdb, poster_url, backdrop_url, trailer_youtube, 'anime' AS tipo FROM animes WHERE status='publicado' AND destaque=1 ORDER BY RAND() LIMIT ?");
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }

    public function findBySlug(string $slug): ?array
    {
        $stmt = $this->db->prepare("
            SELECT a.*, GROUP_CONCAT(g.nome ORDER BY g.nome SEPARATOR ', ') AS generos_str
            FROM animes a
            LEFT JOIN anime_generos ag ON ag.anime_id = a.id
            LEFT JOIN generos g ON g.id = ag.genero_id
            WHERE a.slug = ? AND a.status = 'publicado'
            GROUP BY a.id LIMIT 1
        ");
        $stmt->execute([$slug]);
        $row = $stmt->fetch();
        if ($row) {
            $row['elenco']     = $row['elenco'] ? json_decode($row['elenco'], true) : [];
            $row['temporadas'] = $this->getTemporadas($row['id']);
            $this->db->prepare("UPDATE animes SET visualizacoes = visualizacoes + 1 WHERE id=?")->execute([$row['id']]);
        }
        return $row ?: null;
    }

    public function getTemporadas(int $animeId): array
    {
        $stmt = $this->db->prepare("
            SELECT t.*, COUNT(e.id) AS total_eps
            FROM temporadas t
            LEFT JOIN episodios e ON e.temporada_id = t.id AND e.status='publicado'
            WHERE t.conteudo_id=? AND t.conteudo_tipo='anime'
            GROUP BY t.id ORDER BY t.numero ASC
        ");
        $stmt->execute([$animeId]);
        return $stmt->fetchAll();
    }

    public function adminList(int $page, int $perPage, array $filters = []): array
    {
        [$where, $params] = $this->buildFilters($filters);
        return $this->paginate(
            "SELECT id, titulo, titulo_original, slug, ano_inicio, status, destaque, em_alta, visualizacoes, criado_em FROM animes $where ORDER BY criado_em DESC",
            $params, $page, $perPage
        );
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO animes (imdb_id,titulo,titulo_original,slug,sinopse,sinopse_original,
                ano_inicio,ano_fim,classificacao,nota_imdb,estudio,elenco,poster_url,
                backdrop_url,trailer_youtube,destaque,em_alta,status,criado_por)
            VALUES (:imdb_id,:titulo,:titulo_original,:slug,:sinopse,:sinopse_original,
                :ano_inicio,:ano_fim,:classificacao,:nota_imdb,:estudio,:elenco,:poster_url,
                :backdrop_url,:trailer_youtube,:destaque,:em_alta,:status,:criado_por)
        ");
        $stmt->execute([
            ':imdb_id'=>$data['imdb_id']??null, ':titulo'=>$data['titulo'],
            ':titulo_original'=>$data['titulo_original']??null, ':slug'=>$data['slug'],
            ':sinopse'=>$data['sinopse']??null, ':sinopse_original'=>$data['sinopse_original']??null,
            ':ano_inicio'=>$data['ano_inicio']??null, ':ano_fim'=>$data['ano_fim']??null,
            ':classificacao'=>$data['classificacao']??null, ':nota_imdb'=>$data['nota_imdb']??null,
            ':estudio'=>$data['estudio']??null,
            ':elenco'=>isset($data['elenco'])?json_encode($data['elenco'],JSON_UNESCAPED_UNICODE):null,
            ':poster_url'=>$data['poster_url']??null, ':backdrop_url'=>$data['backdrop_url']??null,
            ':trailer_youtube'=>$data['trailer_youtube']??null,
            ':destaque'=>(int)($data['destaque']??0), ':em_alta'=>(int)($data['em_alta']??0),
            ':status'=>$data['status']??'rascunho', ':criado_por'=>$data['criado_por']??null,
        ]);
        $id = $this->lastInsertId();
        if (!empty($data['generos'])) $this->syncGeneros($id, $data['generos']);
        return $id;
    }

    public function update(int $id, array $data): void
    {
        $fields=[]; $params=[];
        $allowed=['titulo','titulo_original','slug','sinopse','ano_inicio','ano_fim','classificacao',
                  'nota_imdb','estudio','poster_url','backdrop_url','trailer_youtube','destaque','em_alta','status'];
        foreach($allowed as $f){ if(array_key_exists($f,$data)){ $fields[]="$f=?"; $params[]=$data[$f]; } }
        if(isset($data['elenco'])){ $fields[]="elenco=?"; $params[]=json_encode($data['elenco'],JSON_UNESCAPED_UNICODE); }
        if(empty($fields)) return;
        $params[]=$id;
        $this->db->prepare("UPDATE animes SET ".implode(',',$fields)." WHERE id=?")->execute($params);
        if(isset($data['generos'])) $this->syncGeneros($id,$data['generos']);
    }

    public function delete(int $id): void
    {
        $this->db->prepare("DELETE FROM animes WHERE id=?")->execute([$id]);
    }

    public function search(string $q, int $limit=20): array
    {
        $stmt=$this->db->prepare("SELECT id,titulo,slug,ano_inicio AS ano,nota_imdb,poster_url,'anime' AS tipo FROM animes WHERE status='publicado' AND MATCH(titulo,sinopse) AGAINST(? IN BOOLEAN MODE) LIMIT ?");
        $stmt->execute([$q.'*',$limit]);
        return $stmt->fetchAll();
    }

    public function count(): int
    {
        return (int)$this->db->query("SELECT COUNT(*) FROM animes WHERE status='publicado'")->fetchColumn();
    }

    private function syncGeneros(int $id, array $ids): void
    {
        $this->db->prepare("DELETE FROM anime_generos WHERE anime_id=?")->execute([$id]);
        $s=$this->db->prepare("INSERT IGNORE INTO anime_generos (anime_id,genero_id) VALUES (?,?)");
        foreach($ids as $g) $s->execute([$id,(int)$g]);
    }

    private function buildFilters(array $f, ?string $sd=null): array
    {
        $c=[]; $p=[];
        if($sd){ $c[]="status=?"; $p[]=$sd; }
        if(!empty($f['status'])){ $c[]="status=?"; $p[]=$f['status']; }
        if(!empty($f['ano'])){ $c[]="ano_inicio=?"; $p[]=(int)$f['ano']; }
        $w=$c?'WHERE '.implode(' AND ',$c):'';
        return [$w,$p];
    }
}
