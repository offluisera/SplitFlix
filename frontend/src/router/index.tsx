import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import AdminLayout from '@/components/layout/AdminLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'

// ── Public pages (lazy loaded) ────────────────────────────────────
import { lazy, Suspense } from 'react'
import PageLoader from '@/components/ui/PageLoader'

const wrap = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

const HomePage     = lazy(() => import('@/pages/HomePage'))
const FilmePage    = lazy(() => import('@/pages/FilmePage'))
const SeriePage    = lazy(() => import('@/pages/SeriePage'))
const AnimePage    = lazy(() => import('@/pages/AnimePage'))
const EpisodioPage = lazy(() => import('@/pages/EpisodioPage'))
const BuscaPage    = lazy(() => import('@/pages/BuscaPage'))
const LoginPage    = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const NotFound     = lazy(() => import('@/pages/NotFound'))

// ── Admin pages ───────────────────────────────────────────────────
const AdminDashboard  = lazy(() => import('@/pages/admin/Dashboard'))
const AdminFilmes     = lazy(() => import('@/pages/admin/Filmes'))
const AdminFilmeForm  = lazy(() => import('@/pages/admin/FilmeForm'))
const AdminSeries     = lazy(() => import('@/pages/admin/Series'))
const AdminSerieForm  = lazy(() => import('@/pages/admin/SerieForm'))
const AdminAnimes     = lazy(() => import('@/pages/admin/Animes'))
const AdminAnimeForm  = lazy(() => import('@/pages/admin/AnimeForm'))
const AdminTemporadas = lazy(() => import('@/pages/admin/Temporadas'))
const AdminAnuncios   = lazy(() => import('@/pages/admin/Anuncios'))
const AdminAnuncioForm= lazy(() => import('@/pages/admin/AnuncioForm'))
const AdminComentarios= lazy(() => import('@/pages/admin/Comentarios'))
const AdminUsuarios   = lazy(() => import('@/pages/admin/Usuarios'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true,                  element: wrap(HomePage) },
      { path: 'filme/:slug',          element: wrap(FilmePage) },
      { path: 'serie/:slug',          element: wrap(SeriePage) },
      { path: 'anime/:slug',          element: wrap(AnimePage) },
      { path: 'episodio/:id',         element: wrap(EpisodioPage) },
      { path: 'busca',                element: wrap(BuscaPage) },
      { path: 'login',                element: wrap(LoginPage) },
      { path: 'cadastro',             element: wrap(RegisterPage) },
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true,                  element: wrap(AdminDashboard) },
      { path: 'filmes',               element: wrap(AdminFilmes) },
      { path: 'filmes/novo',          element: wrap(AdminFilmeForm) },
      { path: 'filmes/:id/editar',    element: wrap(AdminFilmeForm) },
      { path: 'series',               element: wrap(AdminSeries) },
      { path: 'series/novo',          element: wrap(AdminSerieForm) },
      { path: 'series/:id/editar',    element: wrap(AdminSerieForm) },
      { path: 'series/:id/temporadas',element: wrap(AdminTemporadas) },
      { path: 'animes',               element: wrap(AdminAnimes) },
      { path: 'animes/novo',          element: wrap(AdminAnimeForm) },
      { path: 'animes/:id/editar',    element: wrap(AdminAnimeForm) },
      { path: 'animes/:id/temporadas',element: wrap(AdminTemporadas) },
      { path: 'anuncios',             element: wrap(AdminAnuncios) },
      { path: 'anuncios/novo',        element: wrap(AdminAnuncioForm) },
      { path: 'anuncios/:id/editar',  element: wrap(AdminAnuncioForm) },
      { path: 'comentarios',          element: wrap(AdminComentarios) },
      { path: 'usuarios',             element: wrap(AdminUsuarios) },
      { path: '*',                    element: <Navigate to="/admin" replace /> },
    ],
  },
  { path: '*', element: wrap(NotFound) },
])
