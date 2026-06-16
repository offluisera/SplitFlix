import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { animeService } from '@/services'
import ImdbImporter from '@/components/forms/ImdbImporter'
import toast from 'react-hot-toast'

export default function AnimeForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState<Record<string, unknown>>({
    titulo: '', titulo_original: '', sinopse: '', ano_inicio: '', estudio: '',
    classificacao: '', nota_imdb: '', poster_url: '', backdrop_url: '',
    trailer_youtube: '', status: 'rascunho', destaque: false, em_alta: false,
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!isEdit || !id) return
    animeService.adminList(1).then(({ data }) => {
      const a = data.data.find((x) => x.id === Number(id))
      if (a) setForm(a as unknown as Record<string,unknown>)
    }).finally(() => setLoading(false))
  }, [id, isEdit])

  const handleImport = (data: Record<string, unknown>) => {
    setForm(prev => ({ ...prev, ...data, ano_inicio: data.ano || prev.ano_inicio }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo) { toast.error('Título obrigatório.'); return }
    setSaving(true)
    try {
      if (isEdit) {
        await animeService.update(Number(id), form)
        toast.success('Anime atualizado!')
      } else {
        const { data } = await animeService.create(form)
        toast.success('Anime cadastrado! Adicione as temporadas.')
        navigate(`/admin/animes/${data.data.id}/temporadas`)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Erro ao salvar.')
    }
    setSaving(false)
  }

  if (loading) return <div className="h-64 skeleton rounded-xl" />

  return (
    <>
      <Helmet><title>{isEdit ? 'Editar' : 'Novo'} Anime — Admin</title></Helmet>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">{isEdit ? 'Editar Anime' : 'Novo Anime'}</h1>
          <button type="button" onClick={() => navigate('/admin/animes')} className="btn-ghost text-sm">← Voltar</button>
        </div>

        <ImdbImporter onImport={handleImport} tipo="anime" />

        <div className="card p-6 space-y-5">
          <h2 className="text-white font-semibold border-b border-dark-600 pb-3">Informações</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="label">Título (PT-BR) *</label>
              <input value={form.titulo as string || ''} onChange={e => set('titulo', e.target.value)} required className="input" />
            </div>
            <div>
              <label className="label">Título Original / Japonês</label>
              <input value={form.titulo_original as string || ''} onChange={e => set('titulo_original', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Estúdio</label>
              <input value={form.estudio as string || ''} onChange={e => set('estudio', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Ano de início</label>
              <input type="number" value={form.ano_inicio as number || ''} onChange={e => set('ano_inicio', Number(e.target.value))} className="input" />
            </div>
            <div>
              <label className="label">Nota IMDb</label>
              <input type="number" step="0.1" min={0} max={10} value={form.nota_imdb as number || ''} onChange={e => set('nota_imdb', Number(e.target.value))} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Sinopse</label>
            <textarea value={form.sinopse as string || ''} onChange={e => set('sinopse', e.target.value)} rows={4} className="input resize-none" />
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-white font-semibold border-b border-dark-600 pb-3">Mídia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Poster URL</label>
              <input value={form.poster_url as string || ''} onChange={e => set('poster_url', e.target.value)} className="input" />
              {form.poster_url && <img src={form.poster_url as string} alt="" className="mt-2 h-24 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />}
            </div>
            <div>
              <label className="label">Backdrop URL</label>
              <input value={form.backdrop_url as string || ''} onChange={e => set('backdrop_url', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Trailer YouTube ID</label>
              <input value={form.trailer_youtube as string || ''} onChange={e => set('trailer_youtube', e.target.value)} className="input font-mono" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Status</label>
              <select value={form.status as string} onChange={e => set('status', e.target.value)} className="input">
                {['rascunho','publicado','arquivado'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-6">
              <input type="checkbox" checked={!!form.destaque} onChange={e => set('destaque', e.target.checked)} className="w-4 h-4 accent-brand-600" />
              <span className="text-gray-300 text-sm">Destaque</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer pt-6">
              <input type="checkbox" checked={!!form.em_alta} onChange={e => set('em_alta', e.target.checked)} className="w-4 h-4 accent-brand-600" />
              <span className="text-gray-300 text-sm">Em Alta</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Cadastrar →'}
          </button>
          <button type="button" onClick={() => navigate('/admin/animes')} className="btn-ghost">Cancelar</button>
        </div>
      </form>
    </>
  )
}
