import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { homeService } from '@/services'
import api from '@/services/api'
import { HeroSlider, ContentRow, AdBlock, GenreSection } from '@/components/ui/index'
import type { HomeData, Filme, Serie, Anime } from '@/types'

type AnyContent = Filme | Serie | Anime
interface GeneroData { nome: string; slug: string; items: AnyContent[] }

export default function HomePage() {
  const [data, setData]         = useState<HomeData | null>(null)
  const [generos, setGeneros]   = useState<GeneroData[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    homeService.get()
      .then(({ data: r }) => setData(r.data))
      .finally(() => setLoading(false))

    // Busca categorias populares
    api.get('/generos').then(({ data: r }) => {
      const gen = (r.data || []).slice(0, 8)
      Promise.all(
        gen.map(async (g: { nome: string; slug: string }) => {
          const [f, s, a] = await Promise.all([
            api.get(`/filmes?genero=${g.slug}&per_page=8`).then(r => r.data.data || []).catch(() => []),
            api.get(`/series?genero=${g.slug}&per_page=8`).then(r => r.data.data || []).catch(() => []),
            api.get(`/animes?genero=${g.slug}&per_page=8`).then(r => r.data.data || []).catch(() => []),
          ])
          const items = [...f, ...s, ...a]
          return { ...g, items }
        })
      ).then(result => setGeneros(result.filter(g => g.items.length > 0)))
    }).catch(() => {})
  }, [])

  return (
    <>
      <Helmet>
        <title>Splitflix — Filmes, Séries e Animes</title>
        <meta name="description" content="Assista filmes, séries e animes em HD." />
      </Helmet>

      {/* Hero */}
      {loading
        ? <div className="w-full h-[56vh] skeleton" />
        : <HeroSlider items={data?.hero ?? []} />
      }

      <AdBlock posicao="home_topo" className="max-w-7xl mx-auto px-6 mt-4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">

        {/* Stats bar */}
        {!loading && data && (
          <div className="flex gap-6 mb-8 overflow-x-auto">
            {[
              { icon: '🎬', label: 'Filmes', href: '/?tipo=filme' },
              { icon: '📺', label: 'Séries', href: '/?tipo=serie' },
              { icon: '🌸', label: 'Animes', href: '/?tipo=anime' },
            ].map(item => (
              <Link key={item.label} to={item.href}
                className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-brand-600 rounded-xl px-5 py-3 transition-all flex-shrink-0">
                <span className="text-xl">{item.icon}</span>
                <span className="text-white font-medium text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        <ContentRow title="🔥 Filmes em Alta" items={data?.filmes_em_alta ?? []} loading={loading} viewAllHref="/?tipo=filme" />
        <AdBlock posicao="home_meio" className="mb-8" />
        <ContentRow title="📺 Séries Populares" items={data?.series_populares ?? []} loading={loading} viewAllHref="/?tipo=serie" />
        <ContentRow title="🌸 Animes em Destaque" items={data?.animes_destaque ?? []} loading={loading} viewAllHref="/?tipo=anime" />

        {/* Categorias */}
        {generos.length > 0 && <GenreSection generos={generos} />}

        {(data?.continue_assistindo?.length ?? 0) > 0 && (
          <ContentRow title="▶ Continue Assistindo" items={[]} loading={false} />
        )}

        <AdBlock posicao="home_rodape" className="mb-8" />
      </div>
    </>
  )
}
