// src/pages/admin/Usuarios.tsx
import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { adminService } from '@/services'
import toast from 'react-hot-toast'

interface Usuario {
  id: number
  nome: string
  email: string
  papel: string
  status: string
  ultimo_login?: string
  criado_em: string
}

export default function AdminUsuarios() {
  const [items, setItems]   = useState<Usuario[]>([])
  const [total, setTotal]   = useState(0)
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    adminService.usuarios(page, search)
      .then(({ data }: any) => { setItems(data.data); setTotal(data.meta.total) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page])
  useEffect(() => { setPage(1); load() }, [search])

  const handleStatus = async (id: number, status: string) => {
    try {
      await adminService.updateStatus(id, status)
      toast.success('Status atualizado.')
      load()
    } catch { toast.error('Erro ao atualizar status.') }
  }

  const statusColor = (s: string) => ({
    ativo: 'badge-green', inativo: 'badge-gray', banido: 'badge-red'
  }[s] || 'badge-gray')

  const papelColor = (p: string) => ({
    admin: 'bg-purple-600/20 text-purple-300',
    moderador: 'bg-blue-600/20 text-blue-300',
    usuario: 'badge-gray'
  }[p] || 'badge-gray')

  return (
    <>
      <Helmet><title>Usuários — Admin</title></Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Usuários</h1>
          <p className="text-gray-400 text-sm">{total} registrado(s)</p>
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail..." className="input max-w-sm" />

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-700 text-gray-400 uppercase text-xs">
                <tr>
                  {['Nome','E-mail','Papel','Status','Último Login','Cadastro','Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {loading ? Array.from({length:8}).map((_,i) => (
                  <tr key={i}>{Array.from({length:7}).map((_,j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded w-24" /></td>
                  ))}</tr>
                )) : items.map(u => (
                  <tr key={u.id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center text-xs font-bold text-brand-300 flex-shrink-0">
                          {u.nome.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{u.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${papelColor(u.papel)} capitalize`}>{u.papel}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusColor(u.status)} capitalize`}>{u.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {u.ultimo_login ? new Date(u.ultimo_login).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(u.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.status}
                        onChange={e => handleStatus(u.id, e.target.value)}
                        className="bg-dark-700 border border-dark-600 text-gray-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-brand-500"
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                        <option value="banido">Banido</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && !items.length && (
            <div className="text-center py-12 text-gray-500">Nenhum usuário encontrado.</div>
          )}
        </div>

        {Math.ceil(total / 20) > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
              className="btn-secondary text-sm disabled:opacity-50">←</button>
            <span className="text-gray-400 text-sm">Página {page} de {Math.ceil(total/20)}</span>
            <button onClick={() => setPage(p => Math.min(Math.ceil(total/20), p+1))} disabled={page===Math.ceil(total/20)}
              className="btn-secondary text-sm disabled:opacity-50">→</button>
          </div>
        )}
      </div>
    </>
  )
}
