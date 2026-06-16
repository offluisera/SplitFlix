import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { adminService } from '@/services'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { DashboardData } from '@/types'

interface GraficoItem { dia: string; total: number }

export default function Dashboard() {
  const [dash, setDash]     = useState<DashboardData | null>(null)
  const [grafico, setGrafico] = useState<GraficoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminService.dashboard().then(r => setDash(r.data.data)),
      adminService.grafico(30).then(r => setGrafico(r.data.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const statCards = dash ? [
    { label: 'Filmes',     value: dash.totais.filmes,    icon: '🎬', href: '/admin/filmes',    color: 'from-purple-600 to-purple-800' },
    { label: 'Séries',     value: dash.totais.series,    icon: '📺', href: '/admin/series',    color: 'from-blue-600 to-blue-800' },
    { label: 'Animes',     value: dash.totais.animes,    icon: '🌸', href: '/admin/animes',    color: 'from-orange-500 to-orange-700' },
    { label: 'Episódios',  value: dash.totais.episodios, icon: '▶',  href: '/admin/series',   color: 'from-green-600 to-green-800' },
    { label: 'Usuários',   value: dash.totais.usuarios,  icon: '👥', href: '/admin/usuarios',  color: 'from-pink-600 to-pink-800' },
    { label: 'Acessos Hoje', value: dash.acessos.hoje,  icon: '📈', href: '#',                color: 'from-teal-600 to-teal-800' },
    { label: 'Novos Hoje', value: dash.usuarios.novos_hoje, icon: '✨', href: '/admin/usuarios', color: 'from-indigo-600 to-indigo-800' },
    { label: 'Comentários Pendentes', value: dash.comentarios_pendentes, icon: '💬', href: '/admin/comentarios?status=pendente', color: dash.comentarios_pendentes > 0 ? 'from-red-600 to-red-800' : 'from-gray-600 to-gray-800' },
  ] : []

  return (
    <>
      <Helmet><title>Dashboard — Admin Splitflix</title></Helmet>

      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Visão geral da plataforma</p>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 skeleton rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {statCards.map(s => (
              <Link key={s.label} to={s.href}
                className={`bg-gradient-to-br ${s.color} rounded-xl p-5 hover:opacity-90 transition-opacity`}>
                <div className="text-3xl mb-2">{s.icon}</div>
                <p className="text-2xl font-black text-white">{s.value.toLocaleString('pt-BR')}</p>
                <p className="text-white/70 text-sm mt-1">{s.label}</p>
              </Link>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Acessos — Últimos 30 dias</h2>
          {grafico.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={grafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="dia" tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickFormatter={v => new Date(v).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#e5e7eb' }}
                  itemStyle={{ color: '#a855f7' }}
                  labelFormatter={v => new Date(v).toLocaleDateString('pt-BR')}
                />
                <Line type="monotone" dataKey="total" stroke="#a855f7" strokeWidth={2}
                  dot={{ fill: '#a855f7', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              {loading ? <div className="w-full h-full skeleton rounded" /> : 'Sem dados de acesso ainda.'}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Ações rápidas</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: '+ Novo Filme',   href: '/admin/filmes/novo' },
              { label: '+ Nova Série',   href: '/admin/series/novo' },
              { label: '+ Novo Anime',   href: '/admin/animes/novo' },
              { label: '+ Novo Anúncio', href: '/admin/anuncios/novo' },
              { label: 'Moderar Comentários', href: '/admin/comentarios' },
            ].map(a => (
              <Link key={a.label} to={a.href} className="btn-secondary text-sm">{a.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
