// ── Conteúdo ──────────────────────────────────────────────────────

export type ContentType = 'filme' | 'serie' | 'anime'

export interface Genero {
  id: number
  nome: string
  slug: string
}

export interface ElencoItem {
  nome: string
  personagem: string
}

export interface Filme {
  id: number
  imdb_id?: string
  titulo: string
  titulo_original?: string
  slug: string
  sinopse?: string
  ano?: number
  duracao_min?: number
  classificacao?: string
  nota_imdb?: number
  nota_usuarios?: number
  total_avaliacoes: number
  diretor?: string
  elenco?: ElencoItem[]
  poster_url?: string
  backdrop_url?: string
  trailer_youtube?: string
  embed_dailymotion?: string
  generos_str?: string
  destaque: boolean
  em_alta: boolean
  status: 'publicado' | 'rascunho' | 'arquivado'
  visualizacoes: number
  tipo: 'filme'
}

export interface Serie {
  id: number
  imdb_id?: string
  titulo: string
  titulo_original?: string
  slug: string
  sinopse?: string
  ano_inicio?: number
  ano_fim?: number
  classificacao?: string
  nota_imdb?: number
  nota_usuarios?: number
  total_avaliacoes: number
  criadores?: string
  elenco?: ElencoItem[]
  poster_url?: string
  backdrop_url?: string
  trailer_youtube?: string
  generos_str?: string
  destaque: boolean
  em_alta: boolean
  status: 'publicado' | 'rascunho' | 'arquivado'
  visualizacoes: number
  tipo: 'serie'
  temporadas?: Temporada[]
}

export interface Anime extends Omit<Serie, 'tipo' | 'criadores'> {
  tipo: 'anime'
  titulo_original?: string
  estudio?: string
}

export interface Temporada {
  id: number
  conteudo_id: number
  conteudo_tipo: 'serie' | 'anime'
  numero: number
  titulo?: string
  sinopse?: string
  ano?: number
  poster_url?: string
  total_episodios: number
  total_eps?: number
}

export interface Episodio {
  id: number
  temporada_id: number
  numero: number
  imdb_episode_id?: string
  titulo: string
  sinopse?: string
  duracao_min?: number
  thumbnail_url?: string
  embed_dailymotion: string
  dailymotion_video_id?: string
  status: 'publicado' | 'rascunho'
  visualizacoes: number
  temporada_numero?: number
  conteudo_id?: number
  conteudo_tipo?: 'serie' | 'anime'
}

// ── Auth / Usuário ────────────────────────────────────────────────

export interface Usuario {
  id: number
  nome: string
  email: string
  avatar?: string
  papel: 'admin' | 'moderador' | 'usuario'
  status: 'ativo' | 'inativo' | 'banido'
  ultimo_login?: string
  criado_em: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  user: Usuario
}

// ── Comentários ───────────────────────────────────────────────────

export interface Comentario {
  id: number
  usuario_id: number
  usuario_nome: string
  usuario_avatar?: string
  conteudo_tipo: string
  conteudo_id: number
  parent_id?: number
  texto: string
  status: 'pendente' | 'aprovado' | 'spam' | 'excluido'
  criado_em: string
}

// ── Anúncios ──────────────────────────────────────────────────────

export type AdPosicao =
  | 'header' | 'home_topo' | 'home_meio' | 'home_rodape'
  | 'sidebar' | 'pre_player' | 'pos_player'
  | 'entre_episodios' | 'pagina_conteudo' | 'footer'

export interface Anuncio {
  id: number
  nome: string
  codigo_html: string
  posicao: AdPosicao
  tipo_conteudo: string
  status: 0 | 1
  prioridade: number
  data_inicio?: string
  data_fim?: string
  impressoes: number
  cliques: number
}

// ── API ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: {
    total: number
    page: number
    per_page: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

export interface HomeData {
  hero: (Filme | Serie | Anime)[]
  filmes_em_alta: Filme[]
  series_populares: Serie[]
  animes_destaque: Anime[]
  continue_assistindo: ProgressoItem[]
}

export interface ProgressoItem {
  id: number
  usuario_id: number
  conteudo_tipo: 'filme' | 'episodio'
  conteudo_id: number
  posicao_seg: number
  duracao_seg?: number
  concluido: boolean
  atualizado_em: string
}

export interface DashboardData {
  totais: { filmes: number; series: number; animes: number; episodios: number; usuarios: number }
  acessos: { hoje: number; semana: number }
  usuarios: { novos_hoje: number; novos_semana: number }
  comentarios_pendentes: number
}

export interface ImdbFetchData {
  imdb_id: string
  titulo: string
  titulo_original: string
  sinopse: string
  sinopse_original: string
  ano?: number
  duracao_min?: number
  classificacao?: string
  nota_imdb?: number
  diretor?: string
  criadores?: string
  elenco?: ElencoItem[]
  generos?: string[]
  poster_url?: string
  backdrop_url?: string
  tipo: ContentType
}
