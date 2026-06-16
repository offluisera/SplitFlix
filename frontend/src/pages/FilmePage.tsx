import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { filmeService, comentarioService } from '@/services'
import { StarRating, AdBlock, DailymotionPlayer } from '@/components/ui/index'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import type { Filme, Comentario } from '@/types'

export default function FilmePage() {
  const { slug } = useParams<{ slug: string }>()
  const { isAuthenticated, user } = useAuthStore()
  const [filme, setFilme]     = useState<Filme | null>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<Comentario[]>([])
  const [novoComentario, setNovoComentario] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [showTrailer, setShowTrailer] = useState(false)

  useEffect(() => {
    if (!slug) return
    filmeService.show(slug).then(({ data }) => setFilme(data.data)).finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!filme) return
    comentarioService.list('filme', filme.id)
      .then(({ data }) => setComments(data.data))
      .catch(() => {})
  }, [filme])

  const handleComment = async () => {
    if (!novoComentario.trim()) return
    setSendingComment(true)
    try {
      await comentarioService.store({ conteudo_tipo: 'filme', conteudo_id: filme!.id, texto: novoComentario })
      toast.success('Comentário enviado para moderação.')
      setNovoComentario('')
    } catch { toast.error('Erro ao enviar comentário.') }
    setSendingComment(false)
  }

  if (loading) return (
    <div className="pt-16">
      <div className="w-full h-96 skeleton" />
      <div className="max-w-6xl mx-auto px-4 mt-8 space-y-4">
        <div className="h-10 w-64 skeleton rounded" />
        <div className="h-4 w-full skeleton rounded" />
        <div className="h-4 w-3/4 skeleton rounded" />
      </div>
    </div>
  )

  if (!filme) return (
    <div className="pt-32 text-center">
      <h1 className="text-2xl text-gray-400">Filme não encontrado.</h1>
      <Link to="/" className="btn-primary mt-4 inline-block">Voltar ao início</Link>
    </div>
  )

  return (
    <>
      <Helmet>
        <title>{filme.titulo} — Splitflix</title>
        <meta name="description" content={filme.sinopse?.slice(0, 160)} />
      </Helmet>

      {/* Backdrop */}
      <div className="relative pt-16">
        <div className="relative w-full h-[50vh] overflow-hidden">
          {filme.backdrop_url && (
            <>
              <img src={filme.backdrop_url} alt={filme.titulo} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-dark-950/80 to-transparent" />
            </>
          )}
        </div>

        {/* Main content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-32 relative z-10 pb-16">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Poster */}
            <div className="flex-shrink-0">
              <img src={filme.poster_url || '/placeholder.jpg'} alt={filme.titulo}
                className="w-48 md:w-56 rounded-xl shadow-2xl shadow-black/60" />
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{filme.titulo}</h1>
              {filme.titulo_original && filme.titulo_original !== filme.titulo && (
                <p className="text-gray-400 text-sm mb-3">{filme.titulo_original}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-400">
                {filme.ano && <span>{filme.ano}</span>}
                {filme.duracao_min && <span>• {Math.floor(filme.duracao_min/60)}h {filme.duracao_min%60}min</span>}
                {filme.classificacao && <span className="badge badge-gray">{filme.classificacao}</span>}
                {filme.nota_imdb && <span className="text-yellow-400">★ {filme.nota_imdb} IMDb</span>}
              </div>

              {filme.generos_str && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {filme.generos_str.split(',').map(g => (
                    <span key={g} className="badge-purple badge">{g.trim()}</span>
                  ))}
                </div>
              )}

              {filme.sinopse && <p className="text-gray-300 leading-relaxed mb-5">{filme.sinopse}</p>}

              {filme.diretor && <p className="text-gray-400 text-sm mb-1"><span className="text-white">Diretor:</span> {filme.diretor}</p>}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mt-5">
                {filme.embed_dailymotion && (
                  <button onClick={() => setShowTrailer(false)}
                    className="btn-primary flex items-center gap-2">
                    ▶ Assistir
                  </button>
                )}
                {filme.trailer_youtube && (
                  <button onClick={() => setShowTrailer(true)} className="btn-secondary flex items-center gap-2">
                    🎬 Trailer
                  </button>
                )}
              </div>

              {/* Rating */}
              <div className="mt-6">
                <p className="text-gray-400 text-sm mb-2">Avalie este filme:</p>
                <StarRating tipo="filme" conteudoId={filme.id} media={filme.nota_usuarios} total={filme.total_avaliacoes} />
              </div>
            </div>
          </div>

          {/* Player */}
          {(filme.embed_dailymotion || showTrailer) && (
            <div className="mt-10">
              <AdBlock posicao="pre_player" tipo="filme" className="mb-4" />
              {showTrailer && filme.trailer_youtube ? (
                <div className="aspect-video rounded-xl overflow-hidden">
                  <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${filme.trailer_youtube}`}
                    title="Trailer" allow="autoplay; encrypted-media" allowFullScreen />
                </div>
              ) : filme.embed_dailymotion ? (
                <DailymotionPlayer embedUrl={filme.embed_dailymotion} title={filme.titulo} />
              ) : null}
              <AdBlock posicao="pos_player" tipo="filme" className="mt-4" />
            </div>
          )}

          {/* Elenco */}
          {filme.elenco && filme.elenco.length > 0 && (
            <div className="mt-10">
              <h2 className="section-title">Elenco</h2>
              <div className="flex flex-wrap gap-3">
                {filme.elenco.slice(0, 10).map((e, i) => (
                  <div key={i} className="bg-dark-800 rounded-lg px-3 py-2 text-sm">
                    <p className="text-white font-medium">{e.nome}</p>
                    {e.personagem && <p className="text-gray-400 text-xs">{e.personagem}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comentários */}
          <div className="mt-12">
            <h2 className="section-title">Comentários</h2>
            {isAuthenticated ? (
              <div className="mb-6">
                <textarea value={novoComentario}
                  onChange={e => setNovoComentario(e.target.value)}
                  placeholder="Escreva seu comentário..."
                  rows={3} className="input resize-none" maxLength={2000} />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-500 text-xs">{novoComentario.length}/2000</span>
                  <button onClick={handleComment} disabled={sendingComment || !novoComentario.trim()}
                    className="btn-primary text-sm">
                    {sendingComment ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm mb-4">
                <Link to="/login" className="text-brand-400">Faça login</Link> para comentar.
              </p>
            )}

            <div className="space-y-4">
              {comments.map(c => (
                <div key={c.id} className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center text-sm font-bold text-brand-400">
                      {c.usuario_nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{c.usuario_nome}</p>
                      <p className="text-gray-500 text-xs">{new Date(c.criado_em).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{c.texto}</p>
                </div>
              ))}
              {!comments.length && <p className="text-gray-500 text-sm">Seja o primeiro a comentar!</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
