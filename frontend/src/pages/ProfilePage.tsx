import { useState, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { useAuthStore } from '@/store/authStore'
import { usuarioService } from '@/services'
import toast from 'react-hot-toast'
import { Navigate } from 'react-router-dom'

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser } = useAuthStore()

  // redireciona se não estiver logado
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />

  const [nome, setNome] = useState(user.nome)
  const [savingPerfil, setSavingPerfil] = useState(false)

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null)
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Senha
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [savingSenha, setSavingSenha] = useState(false)
  const [showSenhas, setShowSenhas] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WEBP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 10 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string
      setAvatarPreview(b64)
      setAvatarBase64(b64)
    }
    reader.readAsDataURL(file)
  }

  const handleSavePerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nome.trim().length < 2) { toast.error('Nome deve ter ao menos 2 caracteres.'); return }
    setSavingPerfil(true)
    try {
      const payload: { nome?: string; avatar_base64?: string } = {}
      if (nome.trim() !== user.nome) payload.nome = nome.trim()
      if (avatarBase64) payload.avatar_base64 = avatarBase64

      if (!payload.nome && !payload.avatar_base64) {
        toast('Nenhuma alteração detectada.', { icon: 'ℹ️' })
        setSavingPerfil(false)
        return
      }

      const { data } = await usuarioService.updatePerfil(payload)
      updateUser(data.data)
      setAvatarBase64(null)
      toast.success('Perfil atualizado com sucesso!')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Erro ao salvar perfil.')
    }
    setSavingPerfil(false)
  }

  const handleSaveSenha = async (e: React.FormEvent) => {
    e.preventDefault()
    if (novaSenha !== confirmarSenha) { toast.error('As senhas não coincidem.'); return }
    if (novaSenha.length < 8 || !/[A-Z]/.test(novaSenha) || !/[0-9]/.test(novaSenha)) {
      toast.error('A nova senha precisa ter 8+ chars, 1 maiúscula e 1 número.')
      return
    }
    setSavingSenha(true)
    try {
      await usuarioService.updateSenha({ senha_atual: senhaAtual, nova_senha: novaSenha })
      toast.success('Senha alterada com sucesso!')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
      setShowSenhas(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Erro ao alterar senha.')
    }
    setSavingSenha(false)
  }

  const initials = user.nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()

  return (
    <>
      <Helmet><title>Meu Perfil — Splitflix</title></Helmet>

      <div className="min-h-screen pt-24 pb-16 max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-black text-white mb-8">Meu Perfil</h1>

        {/* ── Avatar + Nome ── */}
        <form onSubmit={handleSavePerfil} className="card p-6 mb-6 space-y-6">
          <h2 className="text-white font-semibold border-b border-dark-600 pb-3">Dados pessoais</h2>

          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-brand-600" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-2xl font-black text-white ring-2 ring-brand-600">
                  {initials}
                </div>
              )}
              <button type="button" onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-600 hover:bg-brand-700 flex items-center justify-center text-white text-xs transition-colors shadow-lg"
                title="Trocar foto">
                ✏
              </button>
            </div>

            <div>
              <p className="text-white font-semibold">{user.nome}</p>
              <p className="text-gray-400 text-sm">{user.email}</p>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="text-brand-400 hover:text-brand-300 text-xs mt-1 transition-colors">
                Trocar foto de perfil
              </button>
            </div>

            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange} className="hidden" />
          </div>

          {/* Info sobre formatos */}
          {avatarBase64 && (
            <p className="text-green-400 text-xs flex items-center gap-1">
              <span>✓</span> Nova foto selecionada — salve para confirmar.
            </p>
          )}

          {/* Nome */}
          <div>
            <label className="label">Nome de exibição</label>
            <input value={nome} onChange={e => setNome(e.target.value)}
              className="input" maxLength={120} required />
          </div>

          {/* Email (somente leitura) */}
          <div>
            <label className="label">E-mail</label>
            <input value={user.email} readOnly className="input opacity-60 cursor-not-allowed" />
            <p className="text-gray-500 text-xs mt-1">O e-mail não pode ser alterado.</p>
          </div>

          {/* Badge de papel */}
          <div className="flex items-center gap-2">
            <label className="label mb-0">Conta</label>
            <span className={`badge ${user.papel === 'admin' ? 'bg-purple-600/20 text-purple-300' : user.papel === 'moderador' ? 'bg-blue-600/20 text-blue-300' : 'badge-gray'} capitalize`}>
              {user.papel}
            </span>
          </div>

          <button type="submit" disabled={savingPerfil} className="btn-primary">
            {savingPerfil ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>

        {/* ── Trocar senha ── */}
        <div className="card p-6">
          <div className="flex items-center justify-between border-b border-dark-600 pb-3 mb-4">
            <h2 className="text-white font-semibold">Segurança</h2>
            <button onClick={() => setShowSenhas(v => !v)}
              className="text-brand-400 hover:text-brand-300 text-sm transition-colors">
              {showSenhas ? 'Cancelar' : 'Alterar senha'}
            </button>
          </div>

          {!showSenhas ? (
            <p className="text-gray-500 text-sm">Clique em "Alterar senha" para definir uma nova senha de acesso.</p>
          ) : (
            <form onSubmit={handleSaveSenha} className="space-y-4">
              <div>
                <label className="label">Senha atual</label>
                <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)}
                  required className="input" autoComplete="current-password" />
              </div>
              <div>
                <label className="label">Nova senha</label>
                <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
                  required className="input" autoComplete="new-password" />
                <p className="text-gray-500 text-xs mt-1">Mínimo 8 caracteres, 1 maiúscula e 1 número.</p>
              </div>
              <div>
                <label className="label">Confirmar nova senha</label>
                <input type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)}
                  required className="input" autoComplete="new-password" />
                {confirmarSenha && novaSenha !== confirmarSenha && (
                  <p className="text-red-400 text-xs mt-1">As senhas não coincidem.</p>
                )}
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={savingSenha || novaSenha !== confirmarSenha} className="btn-primary">
                  {savingSenha ? 'Alterando...' : 'Alterar senha'}
                </button>
                <button type="button" onClick={() => { setShowSenhas(false); setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('') }}
                  className="btn-ghost">
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}