// src/pages/admin/Animes.tsx  — mirrors Series.tsx but for animes
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { animeService } from '@/services'
import toast from 'react-hot-toast'
import type { Anime } from '@/types'

export default function AdminAnimes() {
  const [items, setItems] = useState<Anime[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage]   = useState(1)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    animeService.adminList(page).then(({ data }) => { setItems(data.data); setTotal(data.meta.total) }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page])

  const handleDelete = async (id: number, titulo: string) => {
    if (!confirm(`Excluir "${titulo}"?`)) return
    try { await animeService.delete(id); toast.success('Anime excluído.'); load() }
    catch { toast.error('Erro ao excluir.') }
  }

  return (
    <>
      <Helmet><title>Animes — Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Animes</h1>
            <p className="text-gray-400 text-sm">{total} cadastrado(s)</p>
          </div>
          <Link to="/admin/animes/novo" className="btn-primary text-sm">+ Novo Anime</Link>
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-700 text-gray-400 uppercase text-xs">
                <tr>{['Título','Título JP','Ano','Nota','Status','Ações'].map(h=><th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {loading ? Array.from({length:6}).map((_,i)=>(
                  <tr key={i}>{Array.from({length:6}).map((_,j)=><td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded w-20"/></td>)}</tr>
                )) : items.map(a => (
                  <tr key={a.id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {a.poster_url && <img src={a.poster_url} alt="" className="w-8 h-11 object-cover rounded flex-shrink-0"/>}
                        <p className="text-white font-medium">{a.titulo}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{a.titulo_original||'—'}</td>
                    <td className="px-4 py-3 text-gray-400">{a.ano_inicio||'—'}</td>
                    <td className="px-4 py-3 text-yellow-400">{a.nota_imdb?`★ ${a.nota_imdb}`:'—'}</td>
                    <td className="px-4 py-3"><span className={`badge ${a.status==='publicado'?'badge-green':a.status==='rascunho'?'badge-gray':'badge-red'}`}>{a.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link to={`/admin/animes/${a.id}/temporadas`} className="text-green-400 hover:text-green-300 text-xs font-medium">Eps</Link>
                        <Link to={`/admin/animes/${a.id}/editar`} className="text-brand-400 hover:text-brand-300 text-xs font-medium">Editar</Link>
                        <button onClick={()=>handleDelete(a.id,a.titulo)} className="text-red-400 hover:text-red-300 text-xs font-medium">Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && !items.length && <div className="text-center py-12 text-gray-500"><Link to="/admin/animes/novo" className="btn-primary text-sm inline-block">Adicionar anime</Link></div>}
        </div>
      </div>
    </>
  )
}
