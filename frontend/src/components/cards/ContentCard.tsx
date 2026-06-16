import { Link } from 'react-router-dom'
import type { Filme, Serie, Anime } from '@/types'

type Content = Filme | Serie | Anime

export default function ContentCard({ item }: { item: Content }) {
  const tipo = item.tipo || 'filme'
  const href = `/${tipo}/${item.slug}`
  const ano = 'ano' in item ? item.ano : ('ano_inicio' in item ? (item as Serie).ano_inicio : undefined)

  return (
    <Link to={href} className="content-card group flex-shrink-0 w-36 sm:w-40 md:w-44">
      <div className="relative aspect-[2/3] bg-dark-800 rounded-lg overflow-hidden">
        {item.poster_url ? (
          <img src={item.poster_url} alt={item.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg' }} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 p-3">
            <span className="text-4xl mb-2">{tipo === 'anime' ? '🌸' : tipo === 'serie' ? '📺' : '🎬'}</span>
            <p className="text-xs text-center text-gray-600 line-clamp-2">{item.titulo}</p>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.nota_imdb && (
            <div className="bg-black/80 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-1">
              <span className="text-yellow-400 text-xs">★</span>
              <span className="text-white text-xs font-bold">{item.nota_imdb}</span>
            </div>
          )}
        </div>

        {/* Type badge */}
        <div className={`absolute top-2 right-2 badge text-xs ${tipo === 'filme' ? 'badge-purple' : tipo === 'serie' ? 'badge-green' : 'bg-orange-600/20 text-orange-300'}`}>
          {tipo === 'filme' ? 'F' : tipo === 'serie' ? 'S' : 'A'}
        </div>

        {/* Bottom info on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <p className="text-white text-xs font-semibold line-clamp-2 leading-tight mb-1">{item.titulo}</p>
          {ano && <p className="text-gray-400 text-xs">{ano}</p>}
          <div className={`mt-2 w-full text-center text-xs py-1.5 rounded-md font-medium text-white ${tipo === 'anime' ? 'bg-orange-600' : tipo === 'serie' ? 'bg-green-700' : 'bg-brand-600'}`}>
            ▶ Assistir
          </div>
        </div>
      </div>
      {/* Title below card */}
      <p className="mt-1.5 text-xs text-gray-400 line-clamp-1 px-0.5 group-hover:text-white transition-colors">{item.titulo}</p>
    </Link>
  )
}
