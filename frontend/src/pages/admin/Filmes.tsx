import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { filmeService } from '@/services'
import toast from 'react-hot-toast'
import type { Filme } from '@/types'

export default function AdminFilmes() {
  const [filmes, setFilmes]   = useState<Filme[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [perPage]             = useState(20)
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    filmeService.adminList(page, perPage, search ? { titulo: search } : {})
      .then(({ data }) => { setFilmes(data.data); setTotal(data.meta.total) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page])
  useEffect(() => { setPage(1); load() }, [search])

  const handleDelete = async (id: number, titulo: string) => {
    if (!confirm(`Excluir "${titulo}"? Esta ação não pode ser desfeita.`)) return
    setDeleting(id)
    try {
      await filmeService.delete(id)
      toast.success('Filme excluído.')
      load()
    } catch { toast.error('Erro ao excluir.') }
    setDeleting(null)
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <>
      <Helmet><title>Filmes — Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-white">Filmes</h1>
            <p className="text-gray-400 text-sm">{total} cadastrado(s)</p>
          </div>
          <Link to="/admin/filmes/novo" className="btn-primary text-sm">+ Novo Filme</Link>
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar filmes..." className="input max-w-sm" />

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-700 text-gray-400 uppercase text-xs">
                <tr>
                  {['Título','Ano','Nota','Status','Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded w-24" /></td>
                      ))}
                    </tr>
                  ))
                ) : filmes.map(f => (
                  <tr key={f.id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {f.poster_url && (
                          <img src={f.poster_url} alt={f.titulo} className="w-8 h-11 object-cover rounded flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-white font-medium">{f.titulo}</p>
                          {f.titulo_original && f.titulo_original !== f.titulo && (
                            <p className="text-gray-500 text-xs">{f.titulo_original}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{f.ano || '—'}</td>
                    <td className="px-4 py-3 text-yellow-400">{f.nota_imdb ? `★ ${f.nota_imdb}` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        f.status === 'publicado' ? 'badge-green' : f.status === 'rascunho' ? 'badge-gray' : 'badge-red'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/filmes/${f.id}/editar`}
                          className="text-brand-400 hover:text-brand-300 text-xs font-medium">
                          Editar
                        </Link>
                        <button onClick={() => handleDelete(f.id, f.titulo)}
                          disabled={deleting === f.id}
                          className="text-red-400 hover:text-red-300 text-xs font-medium disabled:opacity-50">
                          {deleting === f.id ? '...' : 'Excluir'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && !filmes.length && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">Nenhum filme encontrado.</p>
              <Link to="/admin/filmes/novo" className="btn-primary text-sm inline-block mt-2">Adicionar filme</Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-secondary text-sm disabled:opacity-50">←</button>
            <span className="text-gray-400 text-sm">Página {page} de {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="btn-secondary text-sm disabled:opacity-50">→</button>
          </div>
        )}
      </div>
    </>
  )
}
