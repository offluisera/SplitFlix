// src/pages/AnimePage.tsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { animeService, episodioService } from '@/services'
import { StarRating, AdBlock } from '@/components/ui/index'
import type { Anime, Temporada, Episodio } from '@/types'

export default function AnimePage() {
  const { slug } = useParams<{ slug: string }>()
  const [anime, setAnime]           = useState<Anime | null>(null)
  const [selectedTemp, setSelectedTemp] = useState<Temporada | null>(null)
  const [episodios, setEpisodios]   = useState<Episodio[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!slug) return
    animeService.show(slug).then(({ data }) => {
      setAnime(data.data)
      if (data.data.temporadas?.length) setSelectedTemp(data.data.temporadas[0])
    }).finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!selectedTemp) return
    episodioService.byTemporada(selectedTemp.id).then(({ data }) => setEpisodios(data.data))
  }, [selectedTemp])

  if (loading) return <div className="pt-32 max-w-6xl mx-auto px-4"><div className="h-64 skeleton rounded-xl" /></div>
  if (!anime) return <div className="pt-32 text-center text-gray-400">Anime não encontrado.</div>

  return (
    <>
      <Helmet><title>{anime.titulo} — Splitflix</title></Helmet>
      <div className="pt-16">
        <div className="relative h-[40vh] overflow-hidden">
          {anime.backdrop_url && (
            <>
              <img src={anime.backdrop_url} alt={anime.titulo} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />
            </>
          )}
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-24 relative z-10 pb-16">
          <div className="flex flex-col md:flex-row gap-8 mb-10">
            <img src={anime.poster_url || '/placeholder.jpg'} alt={anime.titulo}
              className="w-40 md:w-48 rounded-xl shadow-2xl flex-shrink-0" />
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-black text-white mb-1">{anime.titulo}</h1>
              {anime.titulo_original && (
                <p className="text-gray-500 text-sm mb-2">{anime.titulo_original}</p>
              )}
              <div className="flex flex-wrap gap-2 mb-3 text-sm text-gray-400">
                {anime.ano_inicio && <span>{anime.ano_inicio}</span>}
                {anime.estudio && <span>• {anime.estudio}</span>}
                {anime.nota_imdb && <span className="text-yellow-400">★ {anime.nota_imdb}</span>}
                {anime.generos_str && anime.generos_str.split(',').map(g => (
                  <span key={g} className="bg-orange-600/20 text-orange-300 badge">{g.trim()}</span>
                ))}
              </div>
              {anime.sinopse && <p className="text-gray-300 leading-relaxed mb-4">{anime.sinopse}</p>}
              <StarRating tipo="anime" conteudoId={anime.id} media={anime.nota_usuarios} total={anime.total_avaliacoes} />
            </div>
          </div>

          {/* Temporadas / Episódios */}
          {(anime.temporadas?.length ?? 0) > 0 && (
            <>
              <div className="flex gap-2 flex-wrap mb-4">
                {anime.temporadas!.map(t => (
                  <button key={t.id} onClick={() => setSelectedTemp(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedTemp?.id === t.id ? 'bg-brand-600 text-white' : 'bg-dark-800 text-gray-400 hover:text-white'
                    }`}>
                    {t.titulo || `Temporada ${t.numero}`}
                  </button>
                ))}
              </div>

              <AdBlock posicao="entre_episodios" tipo="anime" className="mb-4" />

              <div className="grid gap-3">
                {episodios.map(ep => (
                  <Link key={ep.id} to={`/episodio/${ep.id}`}
                    className="flex items-center gap-4 card p-4 hover:border-orange-500/50 transition-all group">
                    {ep.thumbnail_url ? (
                      <img src={ep.thumbnail_url} alt={ep.titulo} className="w-28 h-16 object-cover rounded flex-shrink-0" />
                    ) : (
                      <div className="w-28 h-16 bg-dark-700 rounded flex items-center justify-center flex-shrink-0 text-gray-500 group-hover:text-orange-400 transition-colors text-xl">
                        ▶
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-xs mb-0.5">Episódio {ep.numero}</p>
                      <p className="text-white font-medium text-sm truncate">{ep.titulo}</p>
                      {ep.sinopse && <p className="text-gray-400 text-xs line-clamp-2 mt-0.5">{ep.sinopse}</p>}
                    </div>
                    {ep.duracao_min && <span className="ml-auto text-gray-500 text-xs flex-shrink-0">{ep.duracao_min}min</span>}
                  </Link>
                ))}
                {!episodios.length && (
                  <p className="text-gray-500 text-sm py-4">Nenhum episódio disponível nesta temporada.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
