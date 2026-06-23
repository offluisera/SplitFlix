import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { serieService, episodioService, comentarioService, avaliacaoService } from '@/services'
import { RatingButton, ReviewList, CommentForm, CommentList, AdBlock } from '@/components/ui/index'
import type { Serie, Temporada, Episodio, Avaliacao } from '@/types'

interface Comentario {
  id: number; texto: string; nota?: number | null
  usuario_id: number; usuario_nome: string; usuario_avatar?: string | null; criado_em: string
}

export default function SeriePage() {
  const { slug } = useParams<{ slug: string }>()
  const [serie, setSerie]               = useState<Serie | null>(null)
  const [selectedTemp, setSelectedTemp] = useState<Temporada | null>(null)
  const [episodios, setEpisodios]       = useState<Episodio[]>([])
  const [loading, setLoading]           = useState(true)
  const [comments, setComments]         = useState<Comentario[]>([])
  const [reviews, setReviews]           = useState<Avaliacao[]>([])
  const [reviewStats, setReviewStats]   = useState<{
    media: number | null; total: number
    minha_nota: number | null
    minha_review: { nota: number; comentario: string | null } | null
  } | null>(null)
  const [reviewsLoading, setReviewsLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    serieService.show(slug).then(({ data }) => {
      setSerie(data.data)
      if (data.data.temporadas?.length) setSelectedTemp(data.data.temporadas[0])
    }).finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!selectedTemp) return
    episodioService.byTemporada(selectedTemp.id).then(({ data }) => setEpisodios(data.data))
  }, [selectedTemp])

  const loadComments = useCallback(() => {
    if (!serie) return
    comentarioService.list('serie', serie.id).then(({ data }) => setComments(data.data ?? [])).catch(() => {})
  }, [serie])
  useEffect(() => { loadComments() }, [loadComments])

  const loadReviews = useCallback(() => {
    if (!serie) return
    setReviewsLoading(true)
    avaliacaoService.get('serie', serie.id, 1, 20)
      .then(({ data }) => {
        setReviews(data.data?.avaliacoes ?? [])
        setReviewStats({
          media: data.data?.media ?? null,
          total: data.data?.total ?? 0,
          minha_nota: data.data?.minha_nota ?? null,
          minha_review: data.data?.minha_review ?? null,
        })
      }).catch(() => {
        setReviews([])
        setReviewStats(null)
      }).finally(() => setReviewsLoading(false))
  }, [serie])
  useEffect(() => { loadReviews() }, [loadReviews])

  const handleDeleteComment = async (id: number) => {
    try {
      await comentarioService.delete(id)
      setComments(prev => prev.filter(c => c.id !== id))
    } catch {
      toast.error('Erro ao excluir comentário.')
    }
  }

  if (loading) return <div className="pt-32 max-w-6xl mx-auto px-4"><div className="h-64 skeleton rounded-xl" /></div>
  if (!serie) return <div className="pt-32 text-center text-gray-400">Série não encontrada.</div>

  return (
    <>
      <Helmet><title>{serie.titulo} — Splitflix</title></Helmet>
      <div className="pt-16">
        <div className="relative h-[40vh] overflow-hidden">
          {serie.backdrop_url && <>
            <img src={serie.backdrop_url} alt={serie.titulo} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />
          </>}
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-24 relative z-10 pb-16">
          <div className="flex flex-col md:flex-row gap-8 mb-10">
            <img src={serie.poster_url || '/placeholder.jpg'} alt={serie.titulo}
              className="w-40 md:w-48 rounded-xl shadow-2xl flex-shrink-0" />
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{serie.titulo}</h1>
              <div className="flex flex-wrap gap-2 mb-3 text-sm text-gray-400">
                {serie.ano_inicio && <span>{serie.ano_inicio}{serie.ano_fim ? ` – ${serie.ano_fim}` : ' – presente'}</span>}
                {serie.nota_imdb && <span className="text-yellow-400">★ {serie.nota_imdb}</span>}
                {serie.generos_str && serie.generos_str.split(',').map(g => (
                  <span key={g} className="badge-purple badge">{g.trim()}</span>
                ))}
              </div>
              {serie.sinopse && <p className="text-gray-300 leading-relaxed mb-4">{serie.sinopse}</p>}
              <div>
                <p className="text-gray-400 text-sm mb-2">Avaliações dos usuários:</p>
                <RatingButton tipo="serie" conteudoId={serie.id}
                  media={reviewStats?.media} total={reviewStats?.total}
                  minhaNota={reviewStats?.minha_nota} minhaReview={reviewStats?.minha_review}
                  onRated={loadReviews} />
              </div>
            </div>
          </div>

          {/* Temporadas */}
          {(serie.temporadas?.length ?? 0) > 0 && (
            <>
              <div className="flex gap-2 flex-wrap mb-4">
                {serie.temporadas!.map(t => (
                  <button key={t.id} onClick={() => setSelectedTemp(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedTemp?.id === t.id ? 'bg-brand-600 text-white' : 'bg-dark-800 text-gray-400 hover:text-white'
                    }`}>
                    {t.titulo || `Temporada ${t.numero}`}
                  </button>
                ))}
              </div>
              <AdBlock posicao="entre_episodios" tipo="serie" className="mb-4" />
              <div className="grid gap-3">
                {episodios.map(ep => (
                  <Link key={ep.id} to={`/episodio/${ep.id}`}
                    className="flex items-center gap-4 card p-4 hover:border-brand-600 transition-all group">
                    {ep.thumbnail_url ? (
                      <img src={ep.thumbnail_url} alt={ep.titulo} className="w-28 h-16 object-cover rounded flex-shrink-0" />
                    ) : (
                      <div className="w-28 h-16 bg-dark-700 rounded flex items-center justify-center flex-shrink-0 text-gray-500 group-hover:text-brand-400 transition-colors text-xl">▶</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-xs mb-0.5">Ep. {ep.numero}</p>
                      <p className="text-white font-medium text-sm truncate">{ep.titulo}</p>
                      {ep.sinopse && <p className="text-gray-400 text-xs line-clamp-2 mt-0.5">{ep.sinopse}</p>}
                    </div>
                    {ep.duracao_min && <span className="ml-auto text-gray-500 text-xs flex-shrink-0">{ep.duracao_min}min</span>}
                  </Link>
                ))}
                {!episodios.length && <p className="text-gray-500 text-sm py-4">Nenhum episódio disponível nesta temporada.</p>}
              </div>
            </>
          )}

          {/* Avaliações */}
          <div className="mt-12">
            <h2 className="section-title">Avaliações</h2>
            <div className="mt-4"><ReviewList avaliacoes={reviews} loading={reviewsLoading} /></div>
          </div>

          {/* Comentários */}
          <div className="mt-12">
            <h2 className="section-title">Comentários</h2>
            <div className="mt-4">
              <CommentForm conteudoTipo="serie" conteudoId={serie.id} onSuccess={loadComments} />
              <CommentList comentarios={comments} onDelete={handleDeleteComment} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}