import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { episodioService, comentarioService, progressoService } from '@/services'
import { DailymotionPlayer, AdBlock } from '@/components/ui/index'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import type { Episodio, Comentario } from '@/types'

export default function EpisodioPage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuthStore()
  const [ep, setEp]               = useState<Episodio | null>(null)
  const [comments, setComments]   = useState<Comentario[]>([])
  const [loading, setLoading]     = useState(true)
  const [texto, setTexto]         = useState('')
  const [sending, setSending]     = useState(false)
  const [allEps, setAllEps]       = useState<Episodio[]>([])
  const saveTimer                 = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (!id) return
    episodioService.show(Number(id)).then(({ data }) => {
      setEp(data.data)
      // Carrega lista de todos episódios da temporada
      episodioService.byTemporada(data.data.temporada_id).then(r => setAllEps(r.data.data))
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!ep) return
    comentarioService.list('episodio', ep.id).then(({ data }) => setComments(data.data)).catch(() => {})
  }, [ep])

  // Salva progresso a cada 30s se autenticado
  useEffect(() => {
    if (!isAuthenticated || !ep) return
    saveTimer.current = setInterval(() => {
      progressoService.save({
        conteudo_tipo: 'episodio',
        conteudo_id: ep.id,
        posicao_seg: 0, // Dailymotion não expõe posição facilmente via iframe
      })
    }, 30000)
    return () => clearInterval(saveTimer.current)
  }, [isAuthenticated, ep])

  const handleComment = async () => {
    if (!texto.trim() || !ep) return
    setSending(true)
    try {
      await comentarioService.store({ conteudo_tipo: 'episodio', conteudo_id: ep.id, texto })
      toast.success('Comentário enviado para moderação.')
      setTexto('')
    } catch { toast.error('Erro ao enviar comentário.') }
    setSending(false)
  }

  const backHref = ep?.conteudo_tipo && ep?.conteudo_id
    ? `/${ep.conteudo_tipo}/${ep.conteudo_id}`
    : '/'

  if (loading) return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="aspect-video skeleton rounded-xl mb-4" />
        <div className="h-8 w-64 skeleton rounded mb-2" />
        <div className="h-4 w-full skeleton rounded" />
      </div>
    </div>
  )

  if (!ep) return (
    <div className="pt-32 text-center">
      <p className="text-gray-400 mb-4">Episódio não encontrado.</p>
      <Link to="/" className="btn-primary">Voltar ao início</Link>
    </div>
  )

  // Episódios anterior / próximo
  const currentIdx = allEps.findIndex(e => e.id === ep.id)
  const prevEp     = currentIdx > 0 ? allEps[currentIdx - 1] : null
  const nextEp     = currentIdx < allEps.length - 1 ? allEps[currentIdx + 1] : null

  return (
    <>
      <Helmet>
        <title>{ep.titulo} — Splitflix</title>
        <meta name="description" content={ep.sinopse?.slice(0, 160) || ep.titulo} />
      </Helmet>

      <div className="pt-16 min-h-screen bg-dark-950">
        <div className="max-w-5xl mx-auto px-4 py-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link to={backHref} className="hover:text-white transition-colors capitalize">
              ← Voltar para {ep.conteudo_tipo}
            </Link>
            <span>•</span>
            <span>Temporada {ep.temporada_numero}</span>
            <span>•</span>
            <span>Ep. {ep.numero}</span>
          </div>

          {/* Pre-player ad */}
          <AdBlock posicao="pre_player" className="mb-4" />

          {/* Player */}
          <DailymotionPlayer
            videoId={ep.dailymotion_video_id}
            embedUrl={ep.embed_dailymotion}
            title={ep.titulo}
          />

          {/* Post-player ad */}
          <AdBlock posicao="pos_player" className="mt-4" />

          {/* Episode info */}
          <div className="mt-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-gray-400 text-sm mb-1">
                  Temporada {ep.temporada_numero} • Episódio {ep.numero}
                  {ep.duracao_min && ` • ${ep.duracao_min}min`}
                </p>
                <h1 className="text-2xl font-bold text-white">{ep.titulo}</h1>
              </div>

              {/* Nav arrows */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {prevEp && (
                  <Link to={`/episodio/${prevEp.id}`}
                    className="btn-secondary text-sm flex items-center gap-1">
                    ← Anterior
                  </Link>
                )}
                {nextEp && (
                  <Link to={`/episodio/${nextEp.id}`}
                    className="btn-primary text-sm flex items-center gap-1">
                    Próximo →
                  </Link>
                )}
              </div>
            </div>

            {ep.sinopse && (
              <p className="text-gray-400 mt-3 leading-relaxed">{ep.sinopse}</p>
            )}
          </div>

          {/* Episode list (same season) */}
          {allEps.length > 1 && (
            <div className="mt-10">
              <h2 className="section-title">Episódios da Temporada</h2>
              <AdBlock posicao="entre_episodios" className="mb-4" />
              <div className="grid gap-2 max-h-96 overflow-y-auto pr-2">
                {allEps.map(e => (
                  <Link key={e.id} to={`/episodio/${e.id}`}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      e.id === ep.id
                        ? 'bg-brand-600/20 border border-brand-600/50'
                        : 'hover:bg-dark-800 border border-transparent'
                    }`}>
                    {e.thumbnail_url ? (
                      <img src={e.thumbnail_url} alt={e.titulo} className="w-20 h-12 object-cover rounded flex-shrink-0" />
                    ) : (
                      <div className={`w-20 h-12 rounded flex items-center justify-center flex-shrink-0 text-sm ${
                        e.id === ep.id ? 'bg-brand-600 text-white' : 'bg-dark-700 text-gray-500'
                      }`}>
                        {e.id === ep.id ? '▶' : e.numero}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-gray-400 text-xs">Ep. {e.numero}</p>
                      <p className={`text-sm font-medium truncate ${e.id === ep.id ? 'text-brand-300' : 'text-white'}`}>
                        {e.titulo}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="mt-12">
            <h2 className="section-title">Comentários</h2>
            {isAuthenticated ? (
              <div className="mb-6">
                <textarea value={texto} onChange={e => setTexto(e.target.value)}
                  placeholder="O que achou deste episódio?"
                  rows={3} className="input resize-none" maxLength={2000} />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-500 text-xs">{texto.length}/2000</span>
                  <button onClick={handleComment} disabled={sending || !texto.trim()} className="btn-primary text-sm">
                    {sending ? 'Enviando...' : 'Comentar'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm mb-4">
                <Link to="/login" className="text-brand-400 hover:underline">Faça login</Link> para comentar.
              </p>
            )}
            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-brand-600/30 flex items-center justify-center text-xs font-bold text-brand-300">
                      {c.usuario_nome.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white text-sm font-medium">{c.usuario_nome}</span>
                    <span className="text-gray-500 text-xs ml-auto">
                      {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">{c.texto}</p>
                </div>
              ))}
              {!comments.length && <p className="text-gray-500 text-sm">Nenhum comentário ainda.</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
