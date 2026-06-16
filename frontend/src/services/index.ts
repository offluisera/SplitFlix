import api from './api'
import type {
  ApiResponse, PaginatedResponse, HomeData, Filme, Serie, Anime,
  Episodio, Temporada, Comentario, Anuncio, AuthTokens, Usuario,
  DashboardData, ImdbFetchData, AdPosicao, ContentType
} from '@/types'

export const authService = {
  register: (d: { nome: string; email: string; senha: string }) => api.post<ApiResponse<AuthTokens>>('/auth/register', d),
  login:    (d: { email: string; senha: string }) => api.post<ApiResponse<AuthTokens>>('/auth/login', d),
  logout:   () => api.post('/auth/logout'),
  me:       () => api.get<ApiResponse<Usuario>>('/auth/me'),
  refresh:  (refresh_token: string) => api.post<ApiResponse<{ access_token: string; refresh_token: string }>>('/auth/refresh', { refresh_token }),
}

export const homeService = {
  get: () => api.get<ApiResponse<HomeData>>('/home'),
}

export const filmeService = {
  list:      (p=1, perPage=20, filters={}) => api.get<PaginatedResponse<Filme>>('/filmes', { params: { page:p, per_page:perPage, ...filters } }),
  show:      (slug: string) => api.get<ApiResponse<Filme>>(`/filmes/${slug}`),
  adminList: (p=1, perPage=20, filters={}) => api.get<PaginatedResponse<Filme>>('/admin/filmes', { params: { page:p, per_page:perPage, ...filters } }),
  adminShow: (id: number) => api.get<ApiResponse<Filme>>(`/admin/filmes/${id}`),
  create:    (d: Record<string,unknown>) => api.post<ApiResponse<{ id: number }>>('/admin/filmes', d),
  update:    (id: number, d: Record<string,unknown>) => api.put(`/admin/filmes/${id}`, d),
  delete:    (id: number) => api.delete(`/admin/filmes/${id}`),
}

export const serieService = {
  list:      (p=1, perPage=20) => api.get<PaginatedResponse<Serie>>('/series', { params: { page:p, per_page:perPage } }),
  show:      (slug: string) => api.get<ApiResponse<Serie>>(`/series/${slug}`),
  adminList: (p=1, perPage=20) => api.get<PaginatedResponse<Serie>>('/admin/series', { params: { page:p, per_page:perPage } }),
  create:    (d: Record<string,unknown>) => api.post<ApiResponse<{ id: number }>>('/admin/series', d),
  update:    (id: number, d: Record<string,unknown>) => api.put(`/admin/series/${id}`, d),
  delete:    (id: number) => api.delete(`/admin/series/${id}`),
}

export const animeService = {
  list:      (p=1, perPage=20) => api.get<PaginatedResponse<Anime>>('/animes', { params: { page:p, per_page:perPage } }),
  show:      (slug: string) => api.get<ApiResponse<Anime>>(`/animes/${slug}`),
  adminList: (p=1, perPage=20) => api.get<PaginatedResponse<Anime>>('/admin/animes', { params: { page:p, per_page:perPage } }),
  create:    (d: Record<string,unknown>) => api.post<ApiResponse<{ id: number }>>('/admin/animes', d),
  update:    (id: number, d: Record<string,unknown>) => api.put(`/admin/animes/${id}`, d),
  delete:    (id: number) => api.delete(`/admin/animes/${id}`),
}

export const episodioService = {
  byTemporada:     (id: number) => api.get<ApiResponse<Episodio[]>>(`/temporadas/${id}/episodios`),
  show:            (id: number) => api.get<ApiResponse<Episodio>>(`/episodios/${id}`),
  adminTemporadas: (tipo: string, id: number) => api.get<ApiResponse<Temporada[]>>(`/admin/temporadas/${tipo}/${id}`),
  createTemporada: (d: Record<string,unknown>) => api.post<ApiResponse<{ id: number }>>('/admin/temporadas', d),
  updateTemporada: (id: number, d: Record<string,unknown>) => api.put(`/admin/temporadas/${id}`, d),
  deleteTemporada: (id: number) => api.delete(`/admin/temporadas/${id}`),
  create:          (d: Record<string,unknown>) => api.post<ApiResponse<{ id: number }>>('/admin/episodios', d),
  update:          (id: number, d: Record<string,unknown>) => api.put(`/admin/episodios/${id}`, d),
  delete:          (id: number) => api.delete(`/admin/episodios/${id}`),
  adminByTemporada:(id: number) => api.get<ApiResponse<Episodio[]>>(`/admin/eps-temporada/${id}`),
}

export const buscaService = {
  search: (q: string, limit=10) => api.get<ApiResponse<{ query:string; filmes:Filme[]; series:Serie[]; animes:Anime[] }>>('/busca', { params:{q,limit} }),
}

export const avaliacaoService = {
  get:   (tipo: ContentType, id: number) => api.get<ApiResponse<{ media:number|null; total:number; minha_nota:number|null }>>(`/avaliacoes/${tipo}/${id}`),
  store: (d: { conteudo_tipo: ContentType; conteudo_id: number; nota: number }) => api.post('/avaliacoes', d),
}

export const comentarioService = {
  list:       (tipo: string, id: number, page=1) => api.get<PaginatedResponse<Comentario>>(`/comentarios/${tipo}/${id}`, { params:{page} }),
  store:      (d: { conteudo_tipo:string; conteudo_id:number; texto:string; parent_id?:number }) => api.post<ApiResponse<{ id:number }>>('/comentarios', d),
  delete:     (id: number) => api.delete(`/comentarios/${id}`),
  adminList:  (p=1, status='') => api.get<PaginatedResponse<Comentario>>('/admin/comentarios', { params:{page:p,status} }),
  aprovar:    (id: number) => api.patch(`/admin/comentarios/${id}/aprovar`),
  spam:       (id: number) => api.patch(`/admin/comentarios/${id}/spam`),
  adminDelete:(id: number) => api.delete(`/admin/comentarios/${id}`),
}

export const anuncioService = {
  byPosicao:  (posicao: AdPosicao, tipo?: string) => api.get<ApiResponse<Anuncio[]>>(`/anuncios/${posicao}`, { params:{tipo} }),
  adminList:  (p=1) => api.get<PaginatedResponse<Anuncio>>('/admin/anuncios', { params:{page:p} }),
  adminShow:  (id: number) => api.get<ApiResponse<Anuncio>>(`/admin/anuncios/${id}`),
  create:     (d: Record<string,unknown>) => api.post<ApiResponse<{ id:number }>>('/admin/anuncios', d),
  update:     (id: number, d: Record<string,unknown>) => api.put(`/admin/anuncios/${id}`, d),
  delete:     (id: number) => api.delete(`/admin/anuncios/${id}`),
  toggle:     (id: number) => api.patch<ApiResponse<{ status:number }>>(`/admin/anuncios/${id}/toggle`),
}

export const adminService = {
  dashboard:    () => api.get<ApiResponse<DashboardData>>('/admin/dashboard'),
  grafico:      (dias=30) => api.get<ApiResponse<{ dia:string; total:number }[]>>('/admin/dashboard/grafico', { params:{dias} }),
  imdbSearch:   (q: string) => api.get<ApiResponse<ImdbSearchResult[]>>(`/admin/imdb/search`, { params:{q} }),
  imdbFetch:    (imdbId: string) => api.get<ApiResponse<ImdbFetchData>>(`/admin/imdb/${imdbId}`),
  imdbTemporadas:(imdbId: string) => api.get<ApiResponse<ImdbTemporada[]>>(`/admin/imdb/${imdbId}/temporadas`),
  imdbEpisodio: (imdbId: string, epId: string) => api.get<ApiResponse<Partial<Episodio>>>(`/admin/imdb/${imdbId}/episodio/${epId}`),
  usuarios:     (p=1, q='') => api.get('/admin/usuarios', { params:{page:p,q} }),
  updateStatus: (id: number, status: string) => api.patch(`/admin/usuarios/${id}/status`, { status }),
}

export const progressoService = {
  save: (d: { conteudo_tipo:string; conteudo_id:number; posicao_seg:number; duracao_seg?:number }) => api.post('/progresso', d),
  list: () => api.get('/progresso'),
}

export const listaService = {
  get:    () => api.get('/usuario/lista'),
  add:    (tipo: ContentType, id: number) => api.post('/usuario/lista', { conteudo_tipo:tipo, conteudo_id:id }),
  remove: (tipo: ContentType, id: number) => api.delete(`/usuario/lista/${tipo}/${id}`),
}

// Extra types for IMDb
export interface ImdbSearchResult {
  imdb_id: string; titulo: string; ano?: string; tipo_omdb?: string; poster_url?: string | null
}
export interface ImdbTemporada {
  numero: number; titulo: string; episodios: { numero:number; imdb_episode_id?:string; titulo:string; sinopse?:string }[]
}
