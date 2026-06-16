import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function NotFound() {
  return (
    <>
      <Helmet><title>404 — Splitflix</title></Helmet>
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <p className="text-8xl font-black text-gradient mb-4">404</p>
          <h1 className="text-2xl font-bold text-white mb-2">Página não encontrada</h1>
          <p className="text-gray-400 mb-8">O conteúdo que você procura não existe ou foi removido.</p>
          <Link to="/" className="btn-primary">← Voltar ao início</Link>
        </div>
      </div>
    </>
  )
}
