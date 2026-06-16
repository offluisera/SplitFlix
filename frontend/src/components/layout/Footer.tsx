// ── Footer ────────────────────────────────────────────────────────
import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="bg-dark-900 border-t border-dark-700 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-black text-gradient mb-4">Splitflix</h3>
            <p className="text-gray-400 text-sm">Sua plataforma de streaming favorita com filmes, séries e animes.</p>
          </div>
          {[
            { title: 'Conteúdo', links: [['Filmes','/?tipo=filme'],['Séries','/?tipo=serie'],['Animes','/?tipo=anime']] },
            { title: 'Conta',    links: [['Login','/login'],['Cadastro','/cadastro']] },
            { title: 'Legal',    links: [['Privacidade','#'],['Termos','#']] },
          ].map(g => (
            <div key={g.title}>
              <h4 className="text-white font-semibold mb-3">{g.title}</h4>
              <ul className="space-y-2">
                {g.links.map(([label, href]) => (
                  <li key={label}><Link to={href} className="text-gray-400 hover:text-white text-sm">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-dark-700 mt-8 pt-8 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Splitflix. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
export default Footer
