import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { anuncioService } from '@/services'
import toast from 'react-hot-toast'
import type { AdPosicao } from '@/types'

const POSICOES: AdPosicao[] = [
  'header','home_topo','home_meio','home_rodape','sidebar',
  'pre_player','pos_player','entre_episodios','pagina_conteudo','footer'
]

export default function AnuncioForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    nome: '', codigo_html: '', posicao: 'home_topo' as AdPosicao,
    tipo_conteudo: 'todos', status: 1, prioridade: 5,
    data_inicio: '', data_fim: '',
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit || !id) return
    anuncioService.adminShow(Number(id))
      .then(({ data }) => {
        const a = data.data
        setForm({
          nome: a.nome, codigo_html: a.codigo_html, posicao: a.posicao,
          tipo_conteudo: a.tipo_conteudo, status: a.status, prioridade: a.prioridade,
          data_inicio: a.data_inicio || '', data_fim: a.data_fim || '',
        })
      })
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const set = (k: string, v: unknown) => setForm(p => ({...p, [k]: v}))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome || !form.codigo_html) { toast.error('Nome e código são obrigatórios.'); return }
    setSaving(true)
    try {
      if (isEdit) {
        await anuncioService.update(Number(id), form)
        toast.success('Anúncio atualizado!')
      } else {
        await anuncioService.create(form)
        toast.success('Anúncio criado!')
        navigate('/admin/anuncios')
      }
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Erro ao salvar.') }
    setSaving(false)
  }

  if (loading) return <div className="h-96 skeleton rounded-xl" />

  return (
    <>
      <Helmet><title>{isEdit ? 'Editar Anúncio' : 'Novo Anúncio'} — Admin</title></Helmet>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">{isEdit ? 'Editar Anúncio' : 'Novo Anúncio'}</h1>
          <button type="button" onClick={() => navigate('/admin/anuncios')} className="btn-ghost text-sm">← Voltar</button>
        </div>

        <div className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome interno *</label>
            <input value={form.nome} onChange={e => set('nome', e.target.value)} required className="input" placeholder="Ex: Banner Home Topo" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Posição *</label>
              <select value={form.posicao} onChange={e => set('posicao', e.target.value as AdPosicao)} className="input">
                {POSICOES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Tipo de conteúdo</label>
              <select value={form.tipo_conteudo} onChange={e => set('tipo_conteudo', e.target.value)} className="input">
                {['todos','filme','serie','anime'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Prioridade (1=maior)</label>
              <input type="number" min={1} max={10} value={form.prioridade}
                onChange={e => set('prioridade', Number(e.target.value))} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
              <select value={form.status} onChange={e => set('status', Number(e.target.value))} className="input">
                <option value={1}>Ativo</option>
                <option value={0}>Inativo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Data início</label>
              <input type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Data fim</label>
              <input type="date" value={form.data_fim} onChange={e => set('data_fim', e.target.value)} className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Código HTML/JavaScript do AdSense *</label>
            <p className="text-gray-500 text-xs mb-2">Cole aqui o código fornecido pelo Google AdSense.</p>
            <textarea value={form.codigo_html} onChange={e => set('codigo_html', e.target.value)}
              required rows={8} className="input resize-none font-mono text-xs" placeholder="<!-- Código AdSense -->" />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar Anúncio'}
          </button>
          <button type="button" onClick={() => navigate('/admin/anuncios')} className="btn-ghost">Cancelar</button>
        </div>
      </form>
    </>
  )
}
