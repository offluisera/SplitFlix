import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { buscaService, filmeService, serieService, animeService } from '@/services'
import ContentCard from '@/components/cards/ContentCard'
import type { Filme, Serie, Anime } from '@/types'

type AnyContent = Filme | Serie | Anime
type Tipo = 'todos' | 'filme' | 'serie' | 'anime'

export default function BuscaPage() {
  const [sp, setSp] = useSearchParams()
  const q    = sp.get('q') || ''
  const tipo = (sp.get('tipo') || 'todos') as Tipo

  const [query, setQuery]     = useState(q)
  const [results, setResults] = useState<{ filmes: Filme[]; series: Serie[]; animes: Anime[] } | null>(null)
  const [browse, setBrowse]   = useState<AnyContent[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter]   = useState<Tipo>(tipo)
  const [page, setPage]       = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // Browse by tipo without query
  useEffect(() => {
    if (q) return
    setLoading(true)
    const perPage = 24
    const p = Promise.all([
      tipo !== 'serie' && tipo !== 'anime' ? filmeService.list(page, perPage).then(r => r.data) : null,
      tipo !== 'filme' && tipo !== 'anime' ? serieService.list(page, perPage).then(r => r.data) : null,
      tipo !== 'filme' && tipo !== 'serie' ? animeService.list(page, perPage).then(r => r.data) : null,
    ]).then(([f, s, a]) => {
      const items: AnyContent[] = [
        ...(f?.data || []),
        ...(s?.data || []),
        ...(a?.data || []),
      ]
      setBrowse(page === 1 ? items : prev => [...prev, ...items])
      setHasMore((f?.meta.has_next || s?.meta.has_next || a?.meta.has_next) ?? false)
    }).finally(() => setLoading(false))
  }, [q, tipo, page])

  // Search by query
  useEffect(() => {
    if (!q || q.length < 2) return
    setLoading(true)
    buscaService.search(q, 30).then(({ data }) => setResults(data.data)).finally(() => setLoading(false))
  }, [q])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.length >= 2) { setSp({ q: query }); setPage(1) }
  }

  const all: AnyContent[] = q
    ? [
        ...(filter === 'todos' || filter === 'filme' ? results?.filmes || [] : []),
        ...(filter === 'todos' || filter === 'serie' ? results?.series || [] : []),
        ...(filter === 'todos' || filter === 'anime' ? results?.animes || [] : []),
      ]
    : browse

  const tipoLabel = { todos: 'Tudo', filme: 'Filmes', serie: 'Séries', anime: 'Animes' }

  return (
    <>
      <Helmet><title>{q ? `Busca: ${q}` : tipoLabel[tipo]} — Splitflix</title></Helmet>
      <div className="pt-24 min-h-screen max-w-7xl mx-auto px-4 pb-16">

        <form onSubmit={handleSearch} className="flex gap-3 mb-6 max-w-xl">
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar filmes, séries e animes..." className="input flex-1" autoFocus />
          <button type="submit" className="btn-primary px-6">Buscar</button>
        </form>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['todos','filme','serie','anime'] as Tipo[]).map(f => (
            <button key={f} onClick={() => { setFilter(f); if (!q) setSp({ tipo: f }); setPage(1) }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f ? 'bg-brand-600 text-white' : 'bg-dark-800 text-gray-400 hover:text-white'
              }`}>
              {tipoLabel[f]}
              {q && results && f !== 'todos' && (
                <span className="ml-1.5 text-xs opacity-60">
                  ({f==='filme' ? results.filmes.length : f==='serie' ? results.series.length : results.animes.length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading && page === 1 ? (
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="w-40 aspect-[2/3] skeleton rounded-lg" />)}
          </div>
        ) : all.length > 0 ? (
          <>
            {q && <p className="text-gray-400 text-sm mb-4">{all.length} resultado(s) para "<strong className="text-white">{q}</strong>"</p>}
            <div className="flex flex-wrap gap-3">
              {all.map(item => <ContentCard key={`${item.tipo||'x'}-${item.id}`} item={item} />)}
            </div>
            {!q && hasMore && (
              <div className="text-center mt-8">
                <button onClick={() => setPage(p => p + 1)} disabled={loading}
                  className="btn-secondary">
                  {loading ? 'Carregando...' : 'Ver mais'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">{q ? '🔍' : '📭'}</p>
            <p className="text-gray-400 text-lg">{q ? `Nenhum resultado para "${q}"` : 'Nenhum conteúdo disponível ainda.'}</p>
            {!q && <p className="text-gray-600 text-sm mt-2">Adicione conteúdo no painel admin.</p>}
          </div>
        )}
      </div>
    </>
  )
}
