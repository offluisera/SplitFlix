// src/pages/admin/Series.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { serieService } from '@/services'
import toast from 'react-hot-toast'
import type { Serie } from '@/types'

export default function AdminSeries() {
  const [items, setItems]   = useState<Serie[]>([])
  const [total, setTotal]   = useState(0)
  const [page, setPage]     = useState(1)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    serieService.adminList(page)
      .then(({ data }) => { setItems(data.data); setTotal(data.meta.total) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page])

  const handleDelete = async (id: number, titulo: string) => {
    if (!confirm(`Excluir "${titulo}"?`)) return
    try { await serieService.delete(id); toast.success('Série excluída.'); load() }
    catch { toast.error('Erro ao excluir.') }
  }

  return (
    <>
      <Helmet><title>Séries — Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Séries</h1>
            <p className="text-gray-400 text-sm">{total} cadastrada(s)</p>
          </div>
          <Link to="/admin/series/novo" className="btn-primary text-sm">+ Nova Série</Link>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-700 text-gray-400 uppercase text-xs">
                <tr>
                  {['Título','Início','Nota','Status','Temporadas','Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {loading ? Array.from({length:6}).map((_,i) => (
                  <tr key={i}>{Array.from({length:6}).map((_,j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded w-20" /></td>
                  ))}</tr>
                )) : items.map(s => (
                  <tr key={s.id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {s.poster_url && <img src={s.poster_url} alt="" className="w-8 h-11 object-cover rounded flex-shrink-0" />}
                        <p className="text-white font-medium">{s.titulo}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{s.ano_inicio || '—'}</td>
                    <td className="px-4 py-3 text-yellow-400">{s.nota_imdb ? `★ ${s.nota_imdb}` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${s.status==='publicado'?'badge-green':s.status==='rascunho'?'badge-gray':'badge-red'}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/series/${s.id}/temporadas`} className="text-brand-400 hover:text-brand-300 text-xs font-medium">
                        Gerenciar
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link to={`/admin/series/${s.id}/editar`} className="text-brand-400 hover:text-brand-300 text-xs font-medium">Editar</Link>
                        <button onClick={() => handleDelete(s.id, s.titulo)} className="text-red-400 hover:text-red-300 text-xs font-medium">Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && !items.length && (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhuma série cadastrada.</p>
              <Link to="/admin/series/novo" className="btn-primary text-sm inline-block mt-2">Adicionar série</Link>
            </div>
          )}
        </div>

        {Math.ceil(total/20) > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1} className="btn-secondary text-sm disabled:opacity-50">←</button>
            <span className="text-gray-400 text-sm">Página {page} de {Math.ceil(total/20)}</span>
            <button onClick={() => setPage(p=>Math.min(Math.ceil(total/20),p+1))} disabled={page===Math.ceil(total/20)} className="btn-secondary text-sm disabled:opacity-50">→</button>
          </div>
        )}
      </div>
    </>
  )
}
