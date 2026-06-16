// src/pages/RegisterPage.tsx
import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuthStore()
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmar: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.senha !== form.confirmar) { toast.error('As senhas não coincidem.'); return }
    setLoading(true)
    try {
      await register(form.nome, form.email, form.senha)
      toast.success('Conta criada com sucesso!')
      navigate('/')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao criar conta.')
    }
    setLoading(false)
  }

  return (
    <>
      <Helmet><title>Cadastro — Splitflix</title></Helmet>
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gradient mb-2">Splitflix</h1>
            <p className="text-gray-400">Crie sua conta gratuita</p>
          </div>
          <div className="card p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Nome', key: 'nome', type: 'text', placeholder: 'Seu nome' },
                { label: 'E-mail', key: 'email', type: 'email', placeholder: 'seu@email.com' },
                { label: 'Senha', key: 'senha', type: 'password', placeholder: '••••••••' },
                { label: 'Confirmar Senha', key: 'confirmar', type: 'password', placeholder: '••••••••' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">{f.label}</label>
                  <input type={f.type} required value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="input" placeholder={f.placeholder} />
                </div>
              ))}
              <p className="text-gray-500 text-xs">Senha: mín. 8 chars, 1 maiúscula, 1 número.</p>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>
            <p className="text-center text-gray-400 text-sm mt-6">
              Já tem conta?{' '}
              <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Entrar</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
