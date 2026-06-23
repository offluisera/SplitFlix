import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { filmeService, comentarioService, avaliacaoService } from '@/services'
import { RatingButton, ReviewList, CommentForm, CommentList, AdBlock, DailymotionPlayer } from '@/components/ui/index'
import type { Filme, Avaliacao } from '@/types'

interface Comentario {
  id: number
  texto: string
  nota?: number | null
  usuario_id: number
  usuario_nome: string
  usuario_avatar?: string | null
  criado_em: string
}

export default function FilmePage() {
  const { slug } = useParams<{ slug: string }>()
  const [filme, setFilme]       = useState<Filme | null>(null)
  const [loading, setLoading]   = useState(true)
  const [comments, setComments] = useState<Comentario[]>([])
  const [showTrailer, setShowTrailer] = useState(false)
  const [reviews, setReviews]   = useState<Avaliacao[]>([])
  const [reviewStats, setReviewStats] = useState<{
    media: number | null; total: number
    minha_nota: number | null
    minha_review: { nota: number; comentario: string | null } | null
  } | null>(null)
  const [reviewsLoading, setReviewsLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    filmeService.show(slug).then(({ data }) => setFilme(data.data)).finally(() => setLoading(false))
  }, [slug])

  const loadComments = useCallback(() => {
    if (!filme) return
    comentarioService.list('filme', filme.id)
      .then(({ data }) => setComments(data.data ?? []))
      .catch(() => {})
  }, [filme])

  useEffect(() => { loadComments() }, [loadComments])

  const loadReviews = useCallback(() => {
    if (!filme) return
    setReviewsLoading(true)
    avaliacaoService.get('filme', filme.id, 1, 20)
      .then(({ data }) => {
        setReviews(data.data?.avaliacoes ?? [])
        setReviewStats({
          media: data.data?.media ?? null,
          total: data.data?.total ?? 0,
          minha_nota: data.data?.minha_nota ?? null,
          minha_review: data.data?.minha_review ?? null,
        })
      })
      .finally(() => setReviewsLoading(false))
  }, [filme])

  useEffect(() => { loadReviews() }, [loadReviews])

  const handleDeleteComment = async (id: number) => {
    try {
      await comentarioService.delete(id)
      setComments(prev => prev.filter(c => c.id !== id))
    } catch {
      toast.error('Erro ao excluir comentário.')
    }
  }

  if (loading) return (
    <div className="pt-16">
      <div className="w-full h-96 skeleton" />
      <div className="max-w-6xl mx-auto px-4 mt-8 space-y-4">
        <div className="h-10 w-64 skeleton rounded" /><div className="h-4 w-full skeleton rounded" />
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

        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-32 relative z-10 pb-16">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              <img src={filme.poster_url || '/placeholder.jpg'} alt={filme.titulo}
                className="w-48 md:w-56 rounded-xl shadow-2xl shadow-black/60" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{filme.titulo}</h1>
              {filme.titulo_original && filme.titulo_original !== filme.titulo && (
                <p className="text-gray-400 text-sm mb-3">{filme.titulo_original}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-400">
                {filme.ano && <span>{filme.ano}</span>}
                {filme.duracao_min && <span>• {Math.floor(filme.duracao_min / 60)}h {filme.duracao_min % 60}min</span>}
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
              {filme.diretor && <p className="text-gray-400 text-sm mb-4"><span className="text-white">Diretor:</span> {filme.diretor}</p>}

              <div className="flex flex-wrap gap-3 mb-6">
                {filme.embed_dailymotion && (
                  <button onClick={() => setShowTrailer(false)} className="btn-primary flex items-center gap-2">
                    ▶ Assistir
                  </button>
                )}
                {filme.trailer_youtube && (
                  <button onClick={() => setShowTrailer(true)} className="btn-secondary flex items-center gap-2">
                    🎬 Trailer
                  </button>
                )}
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-2">Avaliações dos usuários:</p>
                <RatingButton
                  tipo="filme" conteudoId={filme.id}
                  media={reviewStats?.media} total={reviewStats?.total}
                  minhaNota={reviewStats?.minha_nota} minhaReview={reviewStats?.minha_review}
                  onRated={loadReviews}
                />
              </div>
            </div>
          </div>

          {/* Player */}
          {(filme.embed_dailymotion || showTrailer) && (
            <div className="mt-10">
              <AdBlock posicao="pre_player" tipo="filme" className="mb-4" />
              {showTrailer && filme.trailer_youtube ? (
                <div className="aspect-video rounded-xl overflow-hidden">
                  <iframe className="w-full h-full"
                    src={`https://www.youtube.com/embed/${filme.trailer_youtube}`}
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
              <div className="flex flex-wrap gap-3 mt-4">
                {filme.elenco.slice(0, 10).map((e, i) => (
                  <div key={i} className="bg-dark-800 rounded-lg px-3 py-2 text-sm">
                    <p className="text-white font-medium">{e.nome}</p>
                    {e.personagem && <p className="text-gray-400 text-xs">{e.personagem}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avaliações */}
          <div className="mt-12">
            <h2 className="section-title">Avaliações</h2>
            <div className="mt-4">
              <ReviewList avaliacoes={reviews} loading={reviewsLoading} />
            </div>
          </div>

          {/* Comentários */}
          <div className="mt-12">
            <h2 className="section-title">Comentários</h2>
            <div className="mt-4">
              <CommentForm
                conteudoTipo="filme"
                conteudoId={filme.id}
                onSuccess={loadComments}
              />
              <CommentList comentarios={comments} onDelete={handleDeleteComment} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}