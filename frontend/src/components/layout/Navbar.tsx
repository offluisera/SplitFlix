import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { buscaService } from '@/services'
import type { Filme, Serie, Anime } from '@/types'

type SearchResult = (Filme | Serie | Anime)[]

export default function Navbar() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore()
  const [q, setQ]             = useState('')
  const [results, setResults] = useState<SearchResult>([])
  const [showSearch, setShowSearch] = useState(false)
  const [showUser, setShowUser]     = useState(false)
  const [scrolled, setScrolled]     = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const timer     = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setResults([]); setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const handleSearch = (val: string) => {
    setQ(val)
    clearTimeout(timer.current)
    if (val.length < 2) { setResults([]); return }
    timer.current = setTimeout(async () => {
      try {
        const { data } = await buscaService.search(val, 5)
        const all = [...(data.data.filmes||[]), ...(data.data.series||[]), ...(data.data.animes||[])]
        setResults(all.slice(0, 8))
      } catch { setResults([]) }
    }, 350)
  }

  const goTo = (item: Filme | Serie | Anime) => {
    const tipo = item.tipo || 'filme'
    setQ(''); setResults([])
    navigate(`/${tipo}/${item.slug}`)
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-dark-950/98 backdrop-blur-md shadow-lg shadow-black/50 border-b border-dark-800' : 'bg-gradient-to-b from-black/70 to-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-6">

          {/* Logo */}
          <Link to="/" className="text-2xl font-black text-gradient flex-shrink-0">Splitflix</Link>

          {/* Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Filmes',   href: '/busca?tipo=filme',  icon: '🎬' },
              { label: 'Séries',   href: '/busca?tipo=serie',  icon: '📺' },
              { label: 'Animes',   href: '/busca?tipo=anime',  icon: '🌸' },
            ].map(l => (
              <Link key={l.label} to={l.href}
                className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">
                <span className="text-xs">{l.icon}</span>{l.label}
              </Link>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div ref={searchRef} className="relative">
            {showSearch ? (
              <div className="flex items-center gap-2">
                <input autoFocus value={q} onChange={e => handleSearch(e.target.value)}
                  placeholder="Buscar..." className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 w-52 focus:outline-none focus:border-brand-500" />
                <button onClick={() => { setShowSearch(false); setQ(''); setResults([]) }} className="text-gray-400 hover:text-white text-sm">✕</button>
              </div>
            ) : (
              <button onClick={() => setShowSearch(true)} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </button>
            )}

            {results.length > 0 && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl overflow-hidden z-50">
                {results.map(item => {
                  const tipo = item.tipo || 'filme'
                  return (
                    <button key={`${tipo}-${item.id}`} onClick={() => goTo(item)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-700 transition-colors text-left border-b border-dark-700/50 last:border-0">
                      {item.poster_url ? (
                        <img src={item.poster_url} alt="" className="w-9 h-12 object-cover rounded flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-12 bg-dark-700 rounded flex-shrink-0 flex items-center justify-center text-base">
                          {tipo === 'anime' ? '🌸' : tipo === 'serie' ? '📺' : '🎬'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.titulo}</p>
                        <p className="text-gray-500 text-xs capitalize">{tipo} · {'ano' in item ? item.ano : ('ano_inicio' in item ? (item as Serie).ano_inicio : '')}</p>
                      </div>
                    </button>
                  )
                })}
                <button onClick={() => { navigate(`/busca?q=${q}`); setResults([]) }}
                  className="w-full px-4 py-2.5 text-brand-400 text-sm text-center hover:bg-dark-700 transition-colors">
                  Ver todos os resultados →
                </button>
              </div>
            )}
          </div>

          {/* Auth */}
          {isAuthenticated ? (
            <div className="relative">
              <button onClick={() => setShowUser(!showUser)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-sm font-bold text-white">
                  {user?.nome.charAt(0).toUpperCase()}
                </div>
              </button>
              {showUser && (
                <div className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl py-1 z-50">
                  <p className="px-4 py-2.5 text-sm text-gray-400 border-b border-dark-700 truncate">{user?.nome}</p>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setShowUser(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-dark-700 transition-colors">
                      <span>⚙️</span> Painel Admin
                    </Link>
                  )}
                  <button onClick={() => { logout(); setShowUser(false) }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-dark-700 transition-colors">
                    <span>→</span> Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost text-sm py-1.5">Entrar</Link>
              <Link to="/cadastro" className="btn-primary text-sm py-1.5">Cadastrar</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
