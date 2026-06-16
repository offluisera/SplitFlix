import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { anuncioService, avaliacaoService } from '@/services'
import toast from 'react-hot-toast'
import ContentCard from '@/components/cards/ContentCard'
import type { AdPosicao, ContentType, Filme, Serie, Anime } from '@/types'

type AnyContent = Filme | Serie | Anime

// ── StarRating ────────────────────────────────────────────────────
export function StarRating({ tipo, conteudoId, media, total, minhaNote, onRated }: {
  tipo: ContentType; conteudoId: number; media?: number|null
  total?: number; minhaNote?: number|null; onRated?: () => void
}) {
  const [hover, setHover] = useState(0)
  const [loading, setLoading] = useState(false)
  const { isAuthenticated } = { isAuthenticated: !!localStorage.getItem('access_token') }

  const handleRate = async (nota: number) => {
    if (!isAuthenticated) { toast.error('Faça login para avaliar.'); return }
    setLoading(true)
    try {
      await avaliacaoService.store({ conteudo_tipo: tipo, conteudo_id: conteudoId, nota })
      toast.success('Avaliação salva!')
      onRated?.()
    } catch { toast.error('Erro ao salvar avaliação.') }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(star => (
          <button key={star} disabled={loading} onClick={() => handleRate(star)}
            onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
            className={`text-lg transition-colors ${star <= (hover || minhaNote || 0) ? 'text-yellow-400' : 'text-gray-700'} hover:text-yellow-300`}>
            ★
          </button>
        ))}
      </div>
      {media !== undefined && (
        <p className="text-gray-400 text-sm">
          <span className="text-yellow-400 font-bold">{media != null ? Number(media).toFixed(1) : '—'}
</span>
          {total ? ` · ${total} avaliações` : ''}
          {minhaNote ? ` · Sua nota: ${minhaNote}` : ''}
        </p>
      )}
    </div>
  )
}

// ── AdBlock ───────────────────────────────────────────────────────
export function AdBlock({ posicao, tipo, className = '' }: { posicao: AdPosicao; tipo?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [ads, setAds] = useState<Array<{ id: number; codigo_html: string }>>([])
  useEffect(() => {
    anuncioService.byPosicao(posicao, tipo).then(({ data }) => setAds(data.data || [])).catch(() => {})
  }, [posicao, tipo])
  if (!ads.length) return null
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      {ads.map(ad => <div key={ad.id} dangerouslySetInnerHTML={{ __html: ad.codigo_html }} />)}
    </div>
  )
}

// ── DailymotionPlayer ─────────────────────────────────────────────
export function DailymotionPlayer({ videoId, embedUrl, title }: { videoId?: string; embedUrl?: string; title?: string }) {
  const src = videoId ? `https://www.dailymotion.com/embed/video/${videoId}?autoplay=0` : embedUrl?.replace('http:', 'https:') ?? ''
  if (!src) return (
    <div className="aspect-video bg-dark-800 flex items-center justify-center rounded-xl">
      <p className="text-gray-500">Vídeo não disponível.</p>
    </div>
  )
  return (
    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
      <iframe src={src} title={title || 'Player'} className="w-full h-full" allowFullScreen allow="autoplay; fullscreen" referrerPolicy="no-referrer" />
    </div>
  )
}

// ── HeroSlider ────────────────────────────────────────────────────
export function HeroSlider({ items }: { items: AnyContent[] }) {
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    if (items.length < 2) return
    const t = setInterval(() => setCurrent(c => (c + 1) % items.length), 7000)
    return () => clearInterval(t)
  }, [items.length])

  if (!items.length) return null
  const item = items[current]
  // Fallback para tipo undefined
  const tipo = item.tipo || 'filme'
  const href = `/${tipo}/${item.slug}`
  const ano = 'ano' in item ? item.ano : ('ano_inicio' in item ? (item as Serie).ano_inicio : undefined)

  return (
    <div className="relative w-full h-[56vh] min-h-[400px] max-h-[600px] overflow-hidden">
      {items.map((it, i) => (
        <div key={it.id} className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}>
          {(it.backdrop_url || it.poster_url) && (
            <img src={it.backdrop_url || it.poster_url!} alt={it.titulo}
              className="w-full h-full object-cover object-top"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-dark-950/95 via-dark-950/60 to-dark-950/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-dark-950/20" />
        </div>
      ))}

      <div className="relative z-10 flex items-center h-full max-w-7xl mx-auto px-6 pb-8 pt-20">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className={`badge text-xs ${tipo === 'filme' ? 'badge-purple' : tipo === 'serie' ? 'badge-green' : 'bg-orange-600/20 text-orange-300'}`}>
              {tipo === 'filme' ? 'Filme' : tipo === 'serie' ? 'Série' : 'Anime'}
            </span>
            {ano && <span className="text-gray-400 text-sm">{ano}</span>}
            {item.nota_imdb && <span className="text-yellow-400 text-sm font-medium">★ {item.nota_imdb}</span>}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3 drop-shadow-lg">{item.titulo}</h1>
          {item.sinopse && (
            <p className="text-gray-300 text-sm md:text-base line-clamp-2 mb-5 leading-relaxed">{item.sinopse}</p>
          )}
          <div className="flex items-center gap-3">
            <Link to={href} className="btn-primary flex items-center gap-2">
              <span>▶</span> Assistir agora
            </Link>
            <Link to={href} className="btn-secondary">+ Mais info</Link>
          </div>
        </div>
      </div>

      {/* Poster thumbnail - lado direito */}
      <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden lg:block z-10">
        {item.poster_url && (
          <img src={item.poster_url} alt={item.titulo}
            className="h-64 w-44 object-cover rounded-xl shadow-2xl shadow-black/60 ring-2 ring-brand-600/30"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        )}
      </div>

      {/* Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {items.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-brand-500' : 'w-1.5 bg-white/30'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── ContentRow ────────────────────────────────────────────────────
export function ContentRow({ title, items, loading = false, viewAllHref }: {
  title: string; items: AnyContent[]; loading?: boolean; viewAllHref?: string
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">{title}</h2>
        {viewAllHref && (
          <Link to={viewAllHref} className="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors">
            Ver todos →
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-brand-800">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="flex-shrink-0 w-40 aspect-[2/3] skeleton rounded-lg" />)
          : items.map(item => <ContentCard key={`${item.tipo||'x'}-${item.id}`} item={item} />)
        }
        {!loading && !items.length && (
          <p className="text-gray-600 text-sm py-8">Nenhum conteúdo disponível.</p>
        )}
      </div>
    </section>
  )
}

// ── GenreRow ──────────────────────────────────────────────────────
export function GenreSection({ generos }: { generos: { nome: string; slug: string; items: AnyContent[] }[] }) {
  const [active, setActive] = useState(0)
  if (!generos.length) return null
  const current = generos[active]
  return (
    <section className="mb-10">
      <h2 className="section-title mb-4">Explorar por Categoria</h2>
      <div className="flex gap-2 flex-wrap mb-5">
        {generos.map((g, i) => (
          <button key={g.slug} onClick={() => setActive(i)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              i === active ? 'bg-brand-600 text-white' : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
            }`}>
            {g.nome}
          </button>
        ))}
      </div>
      {current.items.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
          {current.items.map(item => <ContentCard key={`${item.tipo}-${item.id}`} item={item} />)}
        </div>
      ) : (
        <p className="text-gray-600 text-sm py-4">Nenhum conteúdo nesta categoria.</p>
      )}
    </section>
  )
}
