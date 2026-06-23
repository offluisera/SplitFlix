import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { comentarioService } from '@/services'
import toast from 'react-hot-toast'

interface ComentarioAdmin {
  id: number
  texto: string
  nota?: number | null
  status: string
  criado_em: string
  conteudo_tipo: string
  conteudo_id: number
  usuario_id: number
  usuario_nome: string
}

export default function AdminComentarios() {
  const [items, setItems]     = useState<ComentarioAdmin[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [status, setStatus]   = useState('pendente')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    comentarioService.adminList(page, status)
      .then(({ data }) => {
        setItems(data.data)
        setTotal(data.meta.total)
      })
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
    if (!confirm('Excluir este comentário permanentemente?')) return
    try { await comentarioService.adminDelete(id); toast.success('Excluído.'); load() }
    catch { toast.error('Erro ao excluir.') }
  }

  const notaColor = (n?: number | null) => {
    if (n == null) return 'text-gray-500'
    if (n >= 8) return 'text-green-400'
    if (n >= 6) return 'text-yellow-400'
    if (n >= 4) return 'text-orange-400'
    return 'text-red-400'
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <>
      <Helmet><title>Comentários — Admin</title></Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Moderação de Comentários</h1>
          <p className="text-gray-400 text-sm mt-1">{total} resultado(s)</p>
        </div>

        {/* Tabs de status */}
        <div className="flex gap-2 flex-wrap">
          {['pendente', 'aprovado', 'spam'].map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                status === s ? 'bg-brand-600 text-white' : 'bg-dark-800 text-gray-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-28 skeleton rounded-xl" />
              ))
            : items.map(c => (
                <div key={c.id} className="card p-4">
                  <div className="flex items-start justify-between gap-4">

                    {/* Conteúdo do comentário */}
                    <div className="flex-1 min-w-0">
                      {/* Meta linha */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-white text-sm font-semibold">{c.usuario_nome}</span>
                        <span className="text-gray-500 text-xs">ID #{c.usuario_id}</span>
                        <span className="text-gray-500 text-xs">•</span>
                        <span className="badge badge-gray capitalize">{c.conteudo_tipo} #{c.conteudo_id}</span>
                        {/* Nota do comentário */}
                        {c.nota != null && (
                          <span className={`badge font-bold text-xs ${notaColor(c.nota)} bg-current/10`}>
                            ★ {c.nota}/10
                          </span>
                        )}
                        <span className="text-gray-500 text-xs ml-auto">
                          {new Date(c.criado_em).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Texto */}
                      <p className="text-gray-300 text-sm leading-relaxed">{c.texto}</p>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {c.status === 'pendente' && (
                        <>
                          <button
                            onClick={() => handleAprovar(c.id)}
                            className="text-xs bg-green-600/20 text-green-300 hover:bg-green-600/40 px-3 py-1.5 rounded-lg transition-colors font-medium"
                          >
                            ✓ Aprovar
                          </button>
                          <button
                            onClick={() => handleSpam(c.id)}
                            className="text-xs bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/40 px-3 py-1.5 rounded-lg transition-colors font-medium"
                          >
                            ⚠ Spam
                          </button>
                        </>
                      )}
                      {c.status === 'aprovado' && (
                        <button
                          onClick={() => handleSpam(c.id)}
                          className="text-xs bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/40 px-3 py-1.5 rounded-lg transition-colors font-medium"
                        >
                          ⚠ Spam
                        </button>
                      )}
                      {/* Botão de apagar: sempre disponível para admin */}
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-xs bg-red-600/20 text-red-300 hover:bg-red-600/40 px-3 py-1.5 rounded-lg transition-colors font-medium"
                      >
                        🗑 Apagar
                      </button>
                    </div>
                  </div>
                </div>
              ))
          }

          {!loading && !items.length && (
            <div className="text-center py-12 text-gray-500">
              Nenhum comentário com status "{status}".
            </div>
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              ←
            </button>
            <span className="text-gray-400 text-sm">Página {page} de {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              →
            </button>
          </div>
        )}
      </div>
    </>
  )
}