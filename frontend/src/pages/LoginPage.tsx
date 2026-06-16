// src/pages/LoginPage.tsx
import { useState, FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()
  const [form, setForm]     = useState({ email: '', senha: '' })
  const [loading, setLoading] = useState(false)
  const from = (location.state as { from?: string })?.from || '/'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.senha)
      toast.success('Bem-vindo de volta!')
      navigate(from, { replace: true })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Credenciais inválidas.')
    }
    setLoading(false)
  }

  return (
    <>
      <Helmet><title>Entrar — Splitflix</title></Helmet>
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gradient mb-2">Splitflix</h1>
            <p className="text-gray-400">Entre na sua conta</p>
          </div>
          <div className="card p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">E-mail</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input" placeholder="seu@email.com" autoComplete="email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Senha</label>
                <input type="password" required value={form.senha}
                  onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                  className="input" placeholder="••••••••" autoComplete="current-password" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
            <p className="text-center text-gray-400 text-sm mt-6">
              Não tem conta?{' '}
              <Link to="/cadastro" className="text-brand-400 hover:text-brand-300 font-medium">Cadastre-se</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
