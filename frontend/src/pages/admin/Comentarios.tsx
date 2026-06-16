// src/pages/admin/Comentarios.tsx
import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { comentarioService } from '@/services'
import toast from 'react-hot-toast'
import type { Comentario } from '@/types'

export default function AdminComentarios() {
  const [items, setItems]   = useState<Comentario[]>([])
  const [total, setTotal]   = useState(0)
  const [page, setPage]     = useState(1)
  const [status, setStatus] = useState('pendente')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    comentarioService.adminList(page, status)
      .then(({ data }) => { setItems(data.data); setTotal(data.meta.total) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page, status])

  const handleAprovar = async (id: number) => {
    try { await comentarioService.aprovar(id); toast.success('Aprovado.'); load() }
    catch { toast.error('Erro.') }
  }
  const handleSpam = async (id: number) => {
    try { await comentarioService.spam(id); toast.success('Marcado como spam.'); load() }
    catch { toast.error('Erro.') }
  }
  const handleDelete = async (id: number) => {
    if (!confirm('Excluir comentário?')) return
    try { await comentarioService.adminDelete(id); toast.success('Excluído.'); load() }
    catch { toast.error('Erro.') }
  }

  return (
    <>
      <Helmet><title>Comentários — Admin</title></Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Moderação de Comentários</h1>
          <p className="text-gray-400 text-sm">{total} resultado(s)</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {['pendente','aprovado','spam','excluido'].map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1) }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                status === s ? 'bg-brand-600 text-white' : 'bg-dark-800 text-gray-400 hover:text-white'
              }`}>
              {s}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? Array.from({length:5}).map((_,i) => (
            <div key={i} className="h-24 skeleton rounded-xl" />
          )) : items.map(c => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-white text-sm font-medium">{c.usuario_nome}</span>
                    <span className="text-gray-500 text-xs">•</span>
                    <span className="badge badge-gray capitalize">{c.conteudo_tipo} #{c.conteudo_id}</span>
                    <span className="text-gray-500 text-xs">{new Date(c.criado_em).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{c.texto}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {c.status === 'pendente' && (
                    <>
                      <button onClick={() => handleAprovar(c.id)}
                        className="text-xs bg-green-600/20 text-green-300 hover:bg-green-600/30 px-2.5 py-1 rounded transition-colors">
                        ✓ Aprovar
                      </button>
                      <button onClick={() => handleSpam(c.id)}
                        className="text-xs bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/30 px-2.5 py-1 rounded transition-colors">
                        Spam
                      </button>
                    </>
                  )}
                  <button onClick={() => handleDelete(c.id)}
                    className="text-xs bg-red-600/20 text-red-300 hover:bg-red-600/30 px-2.5 py-1 rounded transition-colors">
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!loading && !items.length && (
            <div className="text-center py-12 text-gray-500">
              Nenhum comentário com status "{status}".
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
