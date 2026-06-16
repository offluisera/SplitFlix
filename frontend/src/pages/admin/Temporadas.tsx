import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { episodioService, adminService, type ImdbTemporada } from '@/services'
import toast from 'react-hot-toast'
import type { Temporada, Episodio } from '@/types'

export default function AdminTemporadas() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const tipo = location.pathname.includes('/series/') ? 'serie' : 'anime'
  const conteudoId = Number(id)

  const [temporadas, setTemporadas]     = useState<Temporada[]>([])
  const [selectedTemp, setSelectedTemp] = useState<Temporada | null>(null)
  const [episodios, setEpisodios]       = useState<Episodio[]>([])
  const [loading, setLoading]           = useState(true)

  // Auto-import IMDb seasons
  const [imdbId, setImdbId]             = useState('')
  const [importingSeasons, setImportingSeasons] = useState(false)
  const [imdbTemporadas, setImdbTemporadas]     = useState<ImdbTemporada[]>([])

  // New season form
  const [showNewTemp, setShowNewTemp]   = useState(false)
  const [newTemp, setNewTemp]           = useState({ numero: 1, titulo: '' })
  const [savingTemp, setSavingTemp]     = useState(false)

  // New episode form
  const [showNewEp, setShowNewEp]       = useState(false)
  const [epForm, setEpForm]             = useState({
    numero: 1, titulo: '', sinopse: '', embed_dailymotion: '',
    duracao_min: '', imdb_episode_id: '', thumbnail_url: '', status: 'publicado',
  })
  const [fetchingEp, setFetchingEp]     = useState(false)
  const [savingEp, setSavingEp]         = useState(false)

  const loadTemporadas = () => {
    setLoading(true)
    episodioService.adminTemporadas(tipo, conteudoId)
      .then(({ data }) => {
        setTemporadas(data.data || [])
        if ((data.data || []).length > 0 && !selectedTemp) setSelectedTemp(data.data[0])
      })
      .finally(() => setLoading(false))
  }

  const loadEpisodios = () => {
    if (!selectedTemp) return
    episodioService.adminByTemporada(selectedTemp.id)
      .then(({ data }) => setEpisodios(data.data || []))
      .catch(() => setEpisodios([]))
  }

  useEffect(() => { loadTemporadas() }, [conteudoId])
  useEffect(() => { if (selectedTemp) loadEpisodios() }, [selectedTemp?.id])

  // ── Import all seasons from IMDb ──────────────────────────────
  const handleImportSeasons = async () => {
    if (!imdbId.trim()) { toast.error('Informe o IMDb ID (ex: tt0388629)'); return }
    setImportingSeasons(true)
    try {
      const { data } = await adminService.imdbTemporadas(imdbId.trim())
      setImdbTemporadas(data.data || [])
      if (data.data?.length) toast.success(`${data.data.length} temporada(s) encontrada(s). Selecione quais importar.`)
      else toast.error('Nenhuma temporada encontrada.')
    } catch { toast.error('Erro ao buscar temporadas. Verifique o ID e sua chave OMDb.') }
    setImportingSeasons(false)
  }

  const importarTemporada = async (t: ImdbTemporada) => {
    // Cria temporada
    const { data: tdData } = await episodioService.createTemporada({
      conteudo_id: conteudoId, conteudo_tipo: tipo, numero: t.numero, titulo: t.titulo,
    })
    const tempId = tdData.data.id
    // Cria episódios (sem embed — admin adiciona depois)
    for (const ep of t.episodios) {
      try {
        await episodioService.create({
          temporada_id: tempId, numero: ep.numero, titulo: ep.titulo,
          sinopse: ep.sinopse || '', imdb_episode_id: ep.imdb_episode_id,
          embed_dailymotion: 'pendente', status: 'rascunho',
        })
      } catch { /* continua */ }
    }
  }

  const handleImportAll = async () => {
    if (!imdbTemporadas.length) return
    setImportingSeasons(true)
    try {
      for (const t of imdbTemporadas) {
        await importarTemporada(t)
      }
      toast.success(`${imdbTemporadas.length} temporada(s) e episódios importados! Adicione os links Dailymotion.`)
      setImdbTemporadas([])
      loadTemporadas()
    } catch { toast.error('Erro durante importação.') }
    setImportingSeasons(false)
  }

  const importarSingleTemporada = async (t: ImdbTemporada) => {
    setImportingSeasons(true)
    try {
      await importarTemporada(t)
      toast.success(`Temporada ${t.numero} importada com ${t.episodios.length} ep(s)!`)
      loadTemporadas()
    } catch { toast.error('Erro ao importar temporada.') }
    setImportingSeasons(false)
  }

  // ── Season form ───────────────────────────────────────────────
  const handleAddTemp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingTemp(true)
    try {
      await episodioService.createTemporada({ conteudo_id: conteudoId, conteudo_tipo: tipo, ...newTemp })
      toast.success('Temporada criada!')
      setShowNewTemp(false)
      setNewTemp({ numero: temporadas.length + 2, titulo: '' })
      loadTemporadas()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro.')
    }
    setSavingTemp(false)
  }

  const handleDeleteTemp = async (tempId: number) => {
    if (!confirm('Excluir temporada e todos os episódios?')) return
    try { await episodioService.deleteTemporada(tempId); toast.success('Excluída.'); setSelectedTemp(null); loadTemporadas() }
    catch { toast.error('Erro.') }
  }

  // ── Episode form ──────────────────────────────────────────────
  const fetchEpFromImdb = async () => {
    if (!epForm.imdb_episode_id) return
    setFetchingEp(true)
    try {
      const { data } = await adminService.imdbEpisodio('', epForm.imdb_episode_id)
      setEpForm(p => ({ ...p, titulo: data.data.titulo || p.titulo, sinopse: (data.data.sinopse as string) || p.sinopse, duracao_min: String(data.data.duracao_min || p.duracao_min) }))
      toast.success('Dados do episódio importados!')
    } catch { toast.error('Erro ao buscar episódio.') }
    setFetchingEp(false)
  }

  const handleAddEp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemp) { toast.error('Selecione uma temporada.'); return }
    if (!epForm.embed_dailymotion) { toast.error('Link Dailymotion obrigatório.'); return }
    setSavingEp(true)
    try {
      await episodioService.create({
        temporada_id: selectedTemp.id, numero: epForm.numero, titulo: epForm.titulo,
        sinopse: epForm.sinopse, embed_dailymotion: epForm.embed_dailymotion,
        duracao_min: epForm.duracao_min ? Number(epForm.duracao_min) : undefined,
        imdb_episode_id: epForm.imdb_episode_id || undefined,
        thumbnail_url: epForm.thumbnail_url || undefined,
        status: epForm.status,
      })
      toast.success(`Ep. ${epForm.numero} adicionado!`)
      setEpForm(p => ({ ...p, numero: p.numero + 1, titulo: '', sinopse: '', embed_dailymotion: '', imdb_episode_id: '', thumbnail_url: '' }))
      loadEpisodios(); loadTemporadas()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro.')
    }
    setSavingEp(false)
  }

  const handleDeleteEp = async (epId: number) => {
    if (!confirm('Excluir episódio?')) return
    try { await episodioService.delete(epId); toast.success('Excluído.'); loadEpisodios() }
    catch { toast.error('Erro.') }
  }

  const updateEpEmbed = async (epId: number, embed: string) => {
    try {
      await episodioService.update(epId, { embed_dailymotion: embed, status: 'publicado' })
      toast.success('Link salvo!')
      loadEpisodios()
    } catch { toast.error('Erro ao salvar link.') }
  }

  const backPath = tipo === 'serie' ? '/admin/series' : '/admin/animes'

  return (
    <>
      <Helmet><title>Temporadas — Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white capitalize">
              {tipo === 'serie' ? '📺' : '🌸'} Gerenciar {tipo} #{id} — Temporadas e Episódios
            </h1>
            <p className="text-gray-400 text-sm">{temporadas.length} temporada(s)</p>
          </div>
          <button onClick={() => navigate(backPath)} className="btn-ghost text-sm">← Voltar</button>
        </div>

        {/* ── Auto-import from IMDb ── */}
        <div className="card p-5 border-brand-600/30">
          <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
            <span>🚀</span> Importar temporadas do IMDb automaticamente
          </h2>
          <p className="text-gray-500 text-xs mb-3">Cole o ID IMDb da série/anime para importar todas as temporadas e episódios de uma vez. Você só precisará adicionar os links Dailymotion depois.</p>
          <div className="flex gap-2">
            <input value={imdbId} onChange={e => setImdbId(e.target.value)}
              placeholder="tt0388629" className="input flex-1 max-w-xs font-mono" />
            <button onClick={handleImportSeasons} disabled={importingSeasons || !imdbId.trim()} className="btn-primary text-sm">
              {importingSeasons ? 'Buscando...' : 'Buscar Temporadas'}
            </button>
          </div>

          {imdbTemporadas.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white text-sm font-medium">{imdbTemporadas.length} temporada(s) encontrada(s):</p>
                <button onClick={handleImportAll} disabled={importingSeasons} className="btn-primary text-xs px-3 py-1.5">
                  {importingSeasons ? 'Importando...' : '⬇ Importar TUDO'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {imdbTemporadas.map(t => (
                  <button key={t.numero} onClick={() => importarSingleTemporada(t)} disabled={importingSeasons}
                    className="bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-brand-600 rounded-lg p-3 text-left transition-all disabled:opacity-50">
                    <p className="text-white text-sm font-medium">T{t.numero}</p>
                    <p className="text-gray-400 text-xs">{t.episodios.length} eps</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Sidebar: temporadas ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Temporadas</h2>
              <button onClick={() => setShowNewTemp(!showNewTemp)} className="btn-primary text-xs px-3 py-1.5">+ Manual</button>
            </div>

            {showNewTemp && (
              <form onSubmit={handleAddTemp} className="card p-4 space-y-3">
                <div>
                  <label className="label text-xs">Número</label>
                  <input type="number" value={newTemp.numero} onChange={e => setNewTemp(p => ({ ...p, numero: Number(e.target.value) }))}
                    className="input text-sm" min={1} required />
                </div>
                <div>
                  <label className="label text-xs">Título (opcional)</label>
                  <input value={newTemp.titulo} onChange={e => setNewTemp(p => ({ ...p, titulo: e.target.value }))}
                    className="input text-sm" placeholder="Temporada 1" />
                </div>
                <button type="submit" disabled={savingTemp} className="btn-primary text-xs w-full">
                  {savingTemp ? 'Criando...' : 'Criar'}
                </button>
              </form>
            )}

            {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 skeleton rounded-lg" />) : (
              temporadas.map(t => (
                <div key={t.id} onClick={() => setSelectedTemp(t)}
                  className={`card p-3 cursor-pointer transition-all ${selectedTemp?.id === t.id ? 'border-brand-600 bg-brand-600/10' : 'hover:border-dark-500'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">{t.titulo || `Temporada ${t.numero}`}</p>
                      <p className="text-gray-400 text-xs">{t.total_eps ?? t.total_episodios ?? 0} episódio(s)</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleDeleteTemp(t.id) }}
                      className="text-red-400 hover:text-red-300 text-xs p-1">✕</button>
                  </div>
                </div>
              ))
            )}
            {!loading && !temporadas.length && (
              <p className="text-gray-600 text-sm text-center py-4">Use o importador acima ou crie manualmente.</p>
            )}
          </div>

          {/* ── Main: episódios ── */}
          <div className="lg:col-span-2 space-y-4">
            {selectedTemp ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-semibold">
                    {selectedTemp.titulo || `Temporada ${selectedTemp.numero}`} — Episódios
                  </h2>
                  <button onClick={() => setShowNewEp(!showNewEp)} className="btn-primary text-xs px-3 py-1.5">+ Novo Ep.</button>
                </div>

                {showNewEp && (
                  <form onSubmit={handleAddEp} className="card p-5 space-y-4">
                    <h3 className="text-white font-medium text-sm border-b border-dark-600 pb-2">Adicionar Episódio</h3>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="label text-xs">ID IMDb do Episódio (opcional)</label>
                        <input value={epForm.imdb_episode_id} onChange={e => setEpForm(p => ({ ...p, imdb_episode_id: e.target.value }))}
                          placeholder="tt1234567" className="input text-sm font-mono" />
                      </div>
                      <button type="button" onClick={fetchEpFromImdb} disabled={fetchingEp || !epForm.imdb_episode_id}
                        className="btn-secondary text-xs self-end px-3 py-3">
                        {fetchingEp ? '...' : 'Importar'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Número *</label>
                        <input type="number" value={epForm.numero} onChange={e => setEpForm(p => ({ ...p, numero: Number(e.target.value) }))}
                          className="input text-sm" min={1} required />
                      </div>
                      <div>
                        <label className="label text-xs">Duração (min)</label>
                        <input value={epForm.duracao_min} onChange={e => setEpForm(p => ({ ...p, duracao_min: e.target.value }))}
                          className="input text-sm" placeholder="24" />
                      </div>
                    </div>

                    <div>
                      <label className="label text-xs">Título *</label>
                      <input value={epForm.titulo} onChange={e => setEpForm(p => ({ ...p, titulo: e.target.value }))}
                        required className="input text-sm" />
                    </div>

                    <div>
                      <label className="label text-xs">Sinopse</label>
                      <textarea value={epForm.sinopse} onChange={e => setEpForm(p => ({ ...p, sinopse: e.target.value }))}
                        rows={2} className="input text-sm resize-none" />
                    </div>

                    <div>
                      <label className="label text-xs text-red-400">★ Link Embed Dailymotion *</label>
                      <input value={epForm.embed_dailymotion} onChange={e => setEpForm(p => ({ ...p, embed_dailymotion: e.target.value }))}
                        required className="input text-sm font-mono" placeholder="https://www.dailymotion.com/embed/video/xxxxx" />
                    </div>

                    <div>
                      <label className="label text-xs">Thumbnail URL</label>
                      <input value={epForm.thumbnail_url} onChange={e => setEpForm(p => ({ ...p, thumbnail_url: e.target.value }))}
                        className="input text-sm" />
                    </div>

                    <div className="flex gap-2">
                      <button type="submit" disabled={savingEp} className="btn-primary text-sm">
                        {savingEp ? 'Salvando...' : 'Adicionar Episódio'}
                      </button>
                      <button type="button" onClick={() => setShowNewEp(false)} className="btn-ghost text-sm">Cancelar</button>
                    </div>
                  </form>
                )}

                {/* Lista de episódios */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {episodios.map(ep => (
                    <EpCard key={ep.id} ep={ep} onDelete={handleDeleteEp} onSaveEmbed={updateEpEmbed} />
                  ))}
                  {!episodios.length && (
                    <div className="text-center py-10 text-gray-600">
                      <p className="text-3xl mb-2">📭</p>
                      <p className="text-sm">
                        {temporadas.find(t => t.id === selectedTemp.id)?.total_episodios
                          ? 'Episódios foram importados do IMDb. Adicione os links Dailymotion abaixo.'
                          : 'Nenhum episódio ainda.'}
                      </p>
                      <button onClick={() => setShowNewEp(true)} className="btn-primary text-sm mt-3">+ Adicionar</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-600">
                <p>Selecione ou crie uma temporada.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Sub-component: EpCard with inline embed editing ───────────────
function EpCard({ ep, onDelete, onSaveEmbed }: {
  ep: Episodio; onDelete: (id: number) => void; onSaveEmbed: (id: number, embed: string) => void
}) {
  const [embed, setEmbed] = useState(ep.embed_dailymotion === 'pendente' ? '' : ep.embed_dailymotion)
  const [editing, setEditing] = useState(ep.embed_dailymotion === 'pendente')

  return (
    <div className="card p-3">
      <div className="flex items-start gap-3">
        {ep.thumbnail_url ? (
          <img src={ep.thumbnail_url} alt="" className="w-20 h-12 object-cover rounded flex-shrink-0" />
        ) : (
          <div className={`w-20 h-12 rounded flex items-center justify-center text-xs flex-shrink-0 font-bold ${
            ep.status === 'publicado' ? 'bg-brand-600/20 text-brand-400' : 'bg-dark-700 text-gray-500'
          }`}>
            {ep.status === 'publicado' ? `Ep.${ep.numero}` : '⏳'}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-white text-sm font-medium">{ep.numero}. {ep.titulo}</p>
              {ep.embed_dailymotion && ep.embed_dailymotion !== 'pendente' && !editing && (
                <p className="text-gray-500 text-xs truncate max-w-xs">{ep.embed_dailymotion}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`badge text-xs ${ep.status === 'publicado' ? 'badge-green' : 'badge-gray'}`}>{ep.status}</span>
              <button onClick={() => setEditing(!editing)} className="text-brand-400 hover:text-brand-300 text-xs">
                {editing ? '✕' : '✏'}
              </button>
              <button onClick={() => onDelete(ep.id)} className="text-red-400 hover:text-red-300 text-xs">🗑</button>
            </div>
          </div>

          {editing && (
            <div className="flex gap-2 mt-2">
              <input value={embed} onChange={e => setEmbed(e.target.value)}
                className="input text-xs flex-1 font-mono py-1.5" placeholder="https://www.dailymotion.com/embed/video/..." />
              <button onClick={() => { onSaveEmbed(ep.id, embed); setEditing(false) }}
                disabled={!embed.trim()} className="btn-primary text-xs px-3 py-1.5">Salvar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
