// src/pages/SeriePage.tsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { serieService, episodioService } from '@/services'
import { StarRating, AdBlock } from '@/components/ui/index'
import type { Serie, Temporada, Episodio } from '@/types'

export default function SeriePage() {
  const { slug } = useParams<{ slug: string }>()
  const [serie, setSerie]           = useState<Serie | null>(null)
  const [selectedTemp, setSelectedTemp] = useState<Temporada | null>(null)
  const [episodios, setEpisodios]   = useState<Episodio[]>([])
  const [loading, setLoading]       = useState(true)

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

  if (loading) return <div className="pt-32 max-w-6xl mx-auto px-4"><div className="h-64 skeleton rounded-xl" /></div>
  if (!serie) return <div className="pt-32 text-center text-gray-400">Série não encontrada.</div>

  return (
    <>
      <Helmet><title>{serie.titulo} — Splitflix</title></Helmet>
      <div className="pt-16">
        {/* Backdrop */}
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
                {serie.ano_inicio && <span>{serie.ano_inicio}{serie.ano_fim ? ` – ${serie.ano_fim}` : ' – '}</span>}
                {serie.nota_imdb && <span className="text-yellow-400">★ {serie.nota_imdb}</span>}
                {serie.generos_str && serie.generos_str.split(',').map(g => <span key={g} className="badge-purple badge">{g.trim()}</span>)}
              </div>
              {serie.sinopse && <p className="text-gray-300 leading-relaxed mb-4">{serie.sinopse}</p>}
              <StarRating tipo="serie" conteudoId={serie.id} media={serie.nota_usuarios} total={serie.total_avaliacoes} />
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
                      <div className="w-28 h-16 bg-dark-700 rounded flex items-center justify-center flex-shrink-0 text-gray-500 group-hover:text-brand-400 transition-colors">
                        ▶
                      </div>
                    )}
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">Ep. {ep.numero}</p>
                      <p className="text-white font-medium text-sm">{ep.titulo}</p>
                      {ep.sinopse && <p className="text-gray-400 text-xs line-clamp-2 mt-0.5">{ep.sinopse}</p>}
                    </div>
                    {ep.duracao_min && <span className="ml-auto text-gray-500 text-xs flex-shrink-0">{ep.duracao_min}min</span>}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
