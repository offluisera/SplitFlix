import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const menu = [
  { label: 'Dashboard',   href: '/admin',                icon: '📊' },
  { label: '— FILMES',    type: 'divider' },
  { label: 'Filmes',      href: '/admin/filmes',         icon: '🎬' },
  { label: '— SÉRIES',    type: 'divider' },
  { label: 'Séries',      href: '/admin/series',         icon: '📺' },
  { label: '— ANIMES',    type: 'divider' },
  { label: 'Animes',      href: '/admin/animes',         icon: '🌸' },
  { label: '— OUTROS',    type: 'divider' },
  { label: 'Anúncios',    href: '/admin/anuncios',       icon: '📢' },
  { label: 'Comentários', href: '/admin/comentarios',    icon: '💬' },
  { label: 'Usuários',    href: '/admin/usuarios',       icon: '👥' },
] as const

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-dark-900 border-r border-dark-700 flex flex-col transition-all duration-300 flex-shrink-0`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          {sidebarOpen && <span className="font-black text-gradient text-lg">Splitflix</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded text-gray-400 hover:text-white">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {menu.map((item, i) => {
            if ('type' in item) {
              return sidebarOpen ? (
                <p key={i} className="px-3 pt-4 pb-1 text-xs font-bold text-gray-500 tracking-wider">{item.label}</p>
              ) : <hr key={i} className="my-2 border-dark-700" />
            }
            return (
              <NavLink key={item.href} to={item.href} end={item.href === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all ${
                    isActive ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-700'
                  }`
                }>
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-dark-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.nome.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{user?.nome}</p>
                <p className="text-gray-500 text-xs capitalize">{user?.papel}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button onClick={handleLogout}
              className="w-full mt-2 text-red-400 hover:text-red-300 text-xs py-1 hover:bg-dark-700 rounded transition-colors">
              Sair
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
