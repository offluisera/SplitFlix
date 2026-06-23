import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { anuncioService, avaliacaoService, comentarioService } from '@/services'
import toast from 'react-hot-toast'
import ContentCard from '@/components/cards/ContentCard'
import { useAuthStore } from '@/store/authStore'
import type { AdPosicao, ContentType, Filme, Serie, Anime, Avaliacao } from '@/types'

type AnyContent = Filme | Serie | Anime

// ── RatingModal ───────────────────────────────────────────────────
function RatingModal({ open, onClose, tipo, conteudoId, initial, onSaved }: {
  open: boolean
  onClose: () => void
  tipo: ContentType
  conteudoId: number
  initial?: { nota: number; comentario: string | null } | null
  onSaved: () => void
}) {
  const { user } = useAuthStore()
  const [nota, setNota] = useState(initial?.nota ?? 8)
  const [comentario, setComentario] = useState(initial?.comentario ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setNota(initial?.nota ?? 8)
      setComentario(initial?.comentario ?? '')
    }
  }, [open, initial])

  if (!open) return null

  const handleSubmit = async () => {
    if (comentario.trim().length < 3) {
      toast.error('Conte um pouco sobre sua avaliação (mín. 3 caracteres).')
      return
    }
    setSaving(true)
    try {
      await avaliacaoService.store({
        conteudo_tipo: tipo,
        conteudo_id: conteudoId,
        nota,
        comentario: comentario.trim(),
      })
      toast.success('Avaliação salva!')
      onSaved()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Erro ao salvar avaliação.')
    }
    setSaving(false)
  }

  const notaColor = nota >= 8 ? 'text-green-400' : nota >= 6 ? 'text-yellow-400' : nota >= 4 ? 'text-orange-400' : 'text-red-400'
  const notaLabel = nota === 10 ? 'Obra-prima' : nota >= 8 ? 'Excelente' : nota >= 6 ? 'Bom' : nota >= 4 ? 'Regular' : nota >= 2 ? 'Ruim' : 'Péssimo'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card w-full max-w-md p-6 relative animate-fade-in"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl leading-none"
        >
          ✕
        </button>

        <h3 className="text-white font-bold text-lg mb-4">Sua avaliação</h3>

        {/* User identity */}
        <div className="flex items-center gap-3 mb-5 bg-dark-700/50 rounded-lg p-3">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {user?.nome?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-white font-semibold text-sm">{user?.nome}</p>
            <p className="text-gray-500 text-xs">Avaliação pública</p>
          </div>
        </div>

        {/* Nota slider */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Nota</label>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-black ${notaColor}`}>{nota}</span>
              <span className="text-gray-500 text-sm">/ 10</span>
              <span className={`text-xs font-medium ${notaColor}`}>{notaLabel}</span>
            </div>
          </div>
          <input
            type="range" min={0} max={10} step={1} value={nota}
            onChange={e => setNota(Number(e.target.value))}
            className="w-full accent-brand-600 cursor-pointer"
          />
          <div className="flex justify-between text-gray-600 text-xs mt-1">
            <span>0</span><span>5</span><span>10</span>
          </div>
        </div>

        {/* Comentário */}
        <div className="mb-4">
          <label className="label">Por que essa nota? <span className="text-red-400">*</span></label>
          <textarea
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Conte o que achou, pontos positivos e negativos..."
            className="input resize-none"
          />
          <p className="text-gray-600 text-xs mt-1 text-right">{comentario.length}/1000</p>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Salvando...' : 'Enviar avaliação'}
          </button>
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── RatingButton ──────────────────────────────────────────────────
export function RatingButton({ tipo, conteudoId, media, total, minhaNota, minhaReview, onRated }: {
  tipo: ContentType
  conteudoId: number
  media?: number | null
  total?: number
  minhaNota?: number | null
  minhaReview?: { nota: number; comentario: string | null } | null
  onRated?: () => void
}) {
  const { isAuthenticated } = useAuthStore()
  const [open, setOpen] = useState(false)

  const handleOpen = () => {
    if (!isAuthenticated) { toast.error('Faça login para avaliar.'); return }
    setOpen(true)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        {media !== undefined && (
          <p className="text-gray-300 text-sm">
            <span className="text-yellow-400 font-black text-xl">{media != null ? Number(media).toFixed(1) : '—'}</span>
            <span className="text-gray-500"> / 10</span>
            {total ? <span className="text-gray-500 ml-1">· {total} avaliação{total !== 1 ? 'ões' : ''}</span> : null}
          </p>
        )}
        <button onClick={handleOpen} className="btn-secondary text-sm py-1.5 px-4 flex items-center gap-1.5">
          <span className="text-yellow-400">★</span>
          {minhaNota != null ? `Minha nota: ${minhaNota} — editar` : 'Avaliar'}
        </button>
      </div>
      {!isAuthenticated && (
        <p className="text-gray-500 text-xs">
          <Link to="/login" className="text-brand-400 hover:underline">Faça login</Link> para avaliar este título.
        </p>
      )}
      <RatingModal
        open={open}
        onClose={() => setOpen(false)}
        tipo={tipo}
        conteudoId={conteudoId}
        initial={minhaReview}
        onSaved={() => onRated?.()}
      />
    </div>
  )
}

// ── ReviewList ────────────────────────────────────────────────────
export function ReviewList({ avaliacoes, loading }: {
  avaliacoes: Avaliacao[]
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 skeleton rounded-xl" />
        ))}
      </div>
    )
  }

  if (!avaliacoes.length) {
    return <p className="text-gray-500 text-sm py-2">Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>
  }

  const notaColor = (n: number) =>
    n >= 8 ? 'text-green-400 bg-green-400/10' :
    n >= 6 ? 'text-yellow-400 bg-yellow-400/10' :
    n >= 4 ? 'text-orange-400 bg-orange-400/10' :
             'text-red-400 bg-red-400/10'

  return (
    <div className="space-y-3">
      {avaliacoes.map(r => (
        <div key={r.id} className="card p-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            {r.usuario_avatar ? (
              <img
                src={r.usuario_avatar}
                alt={r.usuario_nome}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brand-600/30 flex items-center justify-center text-sm font-bold text-brand-300 flex-shrink-0 mt-0.5">
                {(r.usuario_nome ?? '?').charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Header: nome + data + nota */}
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <div>
                  <span className="text-white text-sm font-semibold">{r.usuario_nome ?? 'Usuário'}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    {r.criado_em ? new Date(r.criado_em).toLocaleDateString('pt-BR') : ''}
                  </span>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-bold flex-shrink-0 ${notaColor(r.nota)}`}>
                  ★ {r.nota}
                </span>
              </div>

              {/* Comentário */}
              {r.comentario && (
                <p className="text-gray-300 text-sm leading-relaxed">{r.comentario}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── CommentForm ───────────────────────────────────────────────────
// Formulário de comentário com campo de nota obrigatório
export function CommentForm({ conteudoTipo, conteudoId, onSuccess }: {
  conteudoTipo: string
  conteudoId: number
  onSuccess?: () => void
}) {
  const { isAuthenticated } = useAuthStore()
  const [texto, setTexto] = useState('')
  const [nota, setNota] = useState<number | ''>('')
  const [sending, setSending] = useState(false)

  if (!isAuthenticated) {
    return (
      <p className="text-gray-400 text-sm mb-4">
        <Link to="/login" className="text-brand-400 hover:underline">Faça login</Link> para comentar.
      </p>
    )
  }

  const handleSubmit = async () => {
    if (nota === '' || nota === undefined) {
      toast.error('Selecione uma nota para o comentário.')
      return
    }
    if (texto.trim().length < 3) {
      toast.error('Comentário muito curto.')
      return
    }
    setSending(true)
    try {
      await comentarioService.store({
        conteudo_tipo: conteudoTipo,
        conteudo_id: conteudoId,
        texto: texto.trim(),
        nota: Number(nota),
      })
      toast.success('Comentário enviado para moderação.')
      setTexto('')
      setNota('')
      onSuccess?.()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Erro ao enviar comentário.')
    }
    setSending(false)
  }

  return (
    <div className="mb-6 space-y-3">
      {/* Nota do comentário */}
      <div>
        <label className="label">
          Nota <span className="text-red-400">*</span>
          {nota !== '' && (
            <span className="ml-2 text-yellow-400 font-bold">{nota}/10</span>
          )}
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: 11 }, (_, i) => i).map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setNota(n)}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                nota === n
                  ? n >= 8 ? 'bg-green-500 text-white'
                  : n >= 6 ? 'bg-yellow-500 text-dark-950'
                  : n >= 4 ? 'bg-orange-500 text-white'
                  : 'bg-red-500 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600 hover:text-white'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Texto */}
      <div>
        <label className="label">Comentário <span className="text-red-400">*</span></label>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Escreva seu comentário..."
          rows={3}
          className="input resize-none"
          maxLength={2000}
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-gray-600 text-xs">{texto.length}/2000</span>
          <button
            onClick={handleSubmit}
            disabled={sending || !texto.trim() || nota === ''}
            className="btn-primary text-sm"
          >
            {sending ? 'Enviando...' : 'Comentar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── CommentList ───────────────────────────────────────────────────
// Lista de comentários aprovados com botão de delete para admins
export function CommentList({ comentarios = [], onDelete }: {
  comentarios?: Array<{
    id: number
    texto: string
    nota?: number | null
    usuario_id: number
    usuario_nome: string
    usuario_avatar?: string | null
    criado_em: string
  }>
  onDelete?: (id: number) => void
}) {
  const { user, isAdmin } = useAuthStore()
  // Garante array mesmo se a prop chegar undefined/null
  const lista = Array.isArray(comentarios) ? comentarios : []

  if (!lista.length) {
    return <p className="text-gray-500 text-sm">Seja o primeiro a comentar!</p>
  }

  return (
    <div className="space-y-4">
      {lista.map(c => (
        <div key={c.id} className="card p-4">
          <div className="flex items-start gap-3">
            {c.usuario_avatar ? (
              <img src={c.usuario_avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center text-sm font-bold text-brand-400 flex-shrink-0 mt-0.5">
                {c.usuario_nome.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white text-sm font-medium">{c.usuario_nome}</span>
                  <span className="text-gray-500 text-xs">
                    {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                  </span>
                  {c.nota != null && (
                    <span className="badge bg-yellow-400/10 text-yellow-400 text-xs font-bold">
                      ★ {c.nota}
                    </span>
                  )}
                </div>
                {/* Delete: admin apaga qualquer um; usuário apaga o próprio */}
                {(isAdmin || user?.id === c.usuario_id) && onDelete && (
                  <button
                    onClick={() => {
                      if (confirm('Excluir este comentário?')) onDelete(c.id)
                    }}
                    className="text-red-400 hover:text-red-300 text-xs flex-shrink-0 transition-colors"
                    title="Excluir comentário"
                  >
                    🗑 Excluir
                  </button>
                )}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{c.texto}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── AdBlock ───────────────────────────────────────────────────────
export function AdBlock({ posicao, tipo, className = '' }: {
  posicao: AdPosicao; tipo?: string; className?: string
}) {
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
export function DailymotionPlayer({ videoId, embedUrl, title }: {
  videoId?: string; embedUrl?: string; title?: string
}) {
  const src = videoId
    ? `https://www.dailymotion.com/embed/video/${videoId}?autoplay=0`
    : embedUrl?.replace('http:', 'https:') ?? ''
  if (!src) return (
    <div className="aspect-video bg-dark-800 flex items-center justify-center rounded-xl">
      <p className="text-gray-500">Vídeo não disponível.</p>
    </div>
  )
  return (
    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
      <iframe
        src={src} title={title || 'Player'}
        className="w-full h-full"
        allowFullScreen allow="autoplay; fullscreen"
        referrerPolicy="no-referrer"
      />
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
            <Link to={href} className="btn-primary flex items-center gap-2"><span>▶</span> Assistir agora</Link>
            <Link to={href} className="btn-secondary">+ Mais info</Link>
          </div>
        </div>
      </div>

      <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden lg:block z-10">
        {item.poster_url && (
          <img src={item.poster_url} alt={item.titulo}
            className="h-64 w-44 object-cover rounded-xl shadow-2xl shadow-black/60 ring-2 ring-brand-600/30"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        )}
      </div>

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

// ── GenreSection ──────────────────────────────────────────────────
export function GenreSection({ generos }: {
  generos: { nome: string; slug: string; items: AnyContent[] }[]
}) {
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