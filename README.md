# Splitflix 🎬

Plataforma de streaming para filmes, séries e animes.

## Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Zustand
- **Backend**: PHP 8.2 + MySQL (XAMPP)
- **Auth**: JWT + Refresh Token
- **Player**: Dailymotion embed
- **IMDb**: OMDb API (scraping automático)

---

## 🚀 Instalação rápida

### 1. Banco de dados
```bash
# No phpMyAdmin ou MySQL CLI:
mysql -u root -p < database/splitflix.sql
```

### 2. Backend (XAMPP)
```bash
# Copie a pasta backend/ para:
# Windows: C:/xampp/htdocs/splitflix/backend/
# Linux:   /var/www/html/splitflix/backend/

# Edite as configs:
backend/config/app.php      # JWT_SECRET, CORS_ALLOWED_ORIGINS
backend/config/database.php # host, user, pass, dbname
backend/controllers/ImdbController.php # OMDB_API_KEY
```

Obtenha chave OMDb gratuita em: https://www.omdbapi.com/apikey.aspx

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env   # ajuste VITE_API_URL se necessário
npm run dev
# Acesse: http://localhost:5173
```

### 4. Build de produção
```bash
cd frontend && npm run build
# Servir /dist com Nginx ou Apache
```

---

## 🔑 Login admin padrão
- **E-mail**: admin@splitflix.local
- **Senha**: Admin@2026!
- **⚠️ Troque imediatamente após o primeiro acesso!**

---

## 📁 Estrutura resumida
```
splitflix/
├── frontend/          # React + Vite
│   └── src/
│       ├── pages/     # Páginas públicas e admin
│       ├── components/# Navbar, Cards, Player, etc.
│       ├── services/  # Chamadas à API
│       ├── store/     # Zustand (auth)
│       └── types/     # TypeScript types
├── backend/           # PHP 8.2 REST API
│   ├── controllers/   # Lógica de negócio
│   ├── models/        # Acesso ao banco (PDO)
│   ├── middleware/    # CORS, Auth, RateLimit
│   ├── helpers/       # JWT, Sanitizer, Response
│   └── routes/api.php # Todas as rotas
└── database/
    └── splitflix.sql  # Schema + seed
```

---

## 🔒 Segurança implementada
- JWT + Refresh Token (HttpOnly recomendado em prod)
- Bcrypt cost 12 para senhas
- Prepared Statements em todas as queries
- Rate limiting (100 req/min global, 5 tentativas de login)
- CORS restrito por origem
- Sanitização de inputs (XSS, SSRF, SQL Injection)
- Headers de segurança via .htaccess
- Validação de código AdSense (bloqueia eval/cookie theft)
- Uploads bloqueados via .htaccess

---

## 🗺️ Rotas principais

### Público
| Rota | Descrição |
|------|-----------|
| `/` | Home com hero, filmes em alta, séries, animes |
| `/filme/:slug` | Detalhe do filme + player |
| `/serie/:slug` | Detalhe da série + episódios |
| `/anime/:slug` | Detalhe do anime + episódios |
| `/episodio/:id` | Player do episódio |
| `/busca?q=termo` | Busca global |
| `/login` | Login |
| `/cadastro` | Cadastro |

### Admin (`/admin`)
| Rota | Descrição |
|------|-----------|
| `/admin` | Dashboard com métricas |
| `/admin/filmes` | CRUD filmes |
| `/admin/series` | CRUD séries |
| `/admin/series/:id/temporadas` | Gerenciar temporadas/eps |
| `/admin/animes` | CRUD animes |
| `/admin/anuncios` | CRUD anúncios AdSense |
| `/admin/comentarios` | Moderação |
| `/admin/usuarios` | Gerenciar usuários |

---

## 📡 API endpoints resumidos

```
POST /auth/register|login|logout|refresh
GET  /auth/me

GET  /home
GET  /busca?q=

GET  /filmes[?page&per_page&ano&genero]
GET  /filmes/:slug
GET  /series/:slug
GET  /animes/:slug
GET  /episodios/:id
GET  /temporadas/:id/episodios

POST /avaliacoes
GET  /avaliacoes/:tipo/:id
GET|POST /comentarios/:tipo/:id
POST /progresso

GET  /anuncios/:posicao

# Admin (Bearer token required)
GET  /admin/dashboard
GET  /admin/imdb/:imdbId
CRUD /admin/filmes|series|animes|episodios|temporadas|anuncios|comentarios|usuarios
```
