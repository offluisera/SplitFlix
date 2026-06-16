import { useState, useRef } from 'react'
import { adminService, type ImdbSearchResult } from '@/services'
import toast from 'react-hot-toast'

interface Props {
  onImport: (data: Record<string, unknown>) => void
  tipo?: 'filme' | 'serie' | 'anime'
}

export default function ImdbImporter({ onImport, tipo }: Props) {
  const [q, setQ]               = useState('')
  const [results, setResults]   = useState<ImdbSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [fetching, setFetching]  = useState(false)
  const [selected, setSelected]  = useState<ImdbSearchResult | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const handleSearch = (value: string) => {
    setQ(value)
    clearTimeout(timer.current)
    if (value.length < 2) { setResults([]); return }
    timer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await adminService.imdbSearch(value)
        setResults(data.data || [])
      } catch { setResults([]) }
      setSearching(false)
    }, 500)
  }

  const handleSelect = async (item: ImdbSearchResult) => {
    setSelected(item)
    setResults([])
    setQ(item.titulo)
    setFetching(true)
    try {
      const { data } = await adminService.imdbFetch(item.imdb_id)
      onImport(data.data as Record<string, unknown>)
      toast.success(`"${item.titulo}" importado com sucesso!`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Erro ao importar. Verifique sua chave OMDb.')
    }
    setFetching(false)
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🔍</span>
        <h2 className="text-white font-semibold">Importar dados do IMDb</h2>
      </div>
      <p className="text-gray-500 text-xs mb-3">
        Pesquise pelo nome para importar automaticamente título, sinopse, elenco, poster e mais.
      </p>

      <div className="relative">
        <input
          value={q}
          onChange={e => handleSearch(e.target.value)}
          placeholder={tipo === 'anime' ? 'Ex: Naruto Shippuden...' : tipo === 'serie' ? 'Ex: Breaking Bad...' : 'Ex: O Poderoso Chefão...'}
          className="input pr-10"
          disabled={fetching}
        />
        {(searching || fetching) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Dropdown de resultados */}
        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
            {results.map(item => (
              <button key={item.imdb_id} onClick={() => handleSelect(item)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-700 transition-colors text-left border-b border-dark-700 last:border-0">
                {item.poster_url ? (
                  <img src={item.poster_url} alt={item.titulo} className="w-10 h-14 object-cover rounded flex-shrink-0" />
                ) : (
                  <div className="w-10 h-14 bg-dark-700 rounded flex items-center justify-center flex-shrink-0 text-gray-600">
                    {item.tipo_omdb === 'series' ? '📺' : '🎬'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.titulo}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {item.ano} · {item.tipo_omdb === 'series' ? 'Série' : 'Filme'} · {item.imdb_id}
                  </p>
                </div>
                <span className="ml-auto text-brand-400 text-xs flex-shrink-0">Selecionar</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && !fetching && (
        <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
          <span>✓</span>
          <span>Dados de <strong>{selected.titulo}</strong> importados — revise e salve abaixo.</span>
        </div>
      )}

      {fetching && (
        <p className="mt-3 text-brand-400 text-sm animate-pulse">Importando dados do IMDb...</p>
      )}
    </div>
  )
}
