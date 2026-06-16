// src/pages/admin/Anuncios.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { anuncioService } from '@/services'
import toast from 'react-hot-toast'
import type { Anuncio } from '@/types'

export default function AdminAnuncios() {
  const [items, setItems]   = useState<Anuncio[]>([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    anuncioService.adminList().then(({ data }) => { setItems(data.data); setTotal(data.meta.total) }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleToggle = async (id: number) => {
    try {
      const { data } = await anuncioService.toggle(id)
      toast.success(data.data.status ? 'Anúncio ativado.' : 'Anúncio desativado.')
      load()
    } catch { toast.error('Erro.') }
  }

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Excluir "${nome}"?`)) return
    try { await anuncioService.delete(id); toast.success('Anúncio excluído.'); load() }
    catch { toast.error('Erro ao excluir.') }
  }

  return (
    <>
      <Helmet><title>Anúncios — Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Anúncios AdSense</h1>
            <p className="text-gray-400 text-sm">{total} anúncio(s)</p>
          </div>
          <Link to="/admin/anuncios/novo" className="btn-primary text-sm">+ Novo Anúncio</Link>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-700 text-gray-400 uppercase text-xs">
                <tr>{['Nome','Posição','Tipo','Prioridade','Status','Ações'].map(h=><th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {loading ? Array.from({length:5}).map((_,i)=>(
                  <tr key={i}>{Array.from({length:6}).map((_,j)=><td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded w-24"/></td>)}</tr>
                )) : items.map(a => (
                  <tr key={a.id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{a.nome}</td>
                    <td className="px-4 py-3"><span className="badge badge-purple">{a.posicao}</span></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{a.tipo_conteudo}</td>
                    <td className="px-4 py-3 text-gray-400">{a.prioridade}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(a.id)}
                        className={`badge cursor-pointer ${a.status ? 'badge-green' : 'badge-gray'}`}>
                        {a.status ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link to={`/admin/anuncios/${a.id}/editar`} className="text-brand-400 hover:text-brand-300 text-xs font-medium">Editar</Link>
                        <button onClick={() => handleDelete(a.id, a.nome)} className="text-red-400 hover:text-red-300 text-xs font-medium">Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && !items.length && (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhum anúncio cadastrado.</p>
              <Link to="/admin/anuncios/novo" className="btn-primary text-sm inline-block mt-2">Criar anúncio</Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
