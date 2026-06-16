import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario } from '@/types'
import { authService } from '@/services'

interface AuthState {
  user: Usuario | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, senha: string) => Promise<void>
  register: (nome: string, email: string, senha: string) => Promise<void>
  logout: () => Promise<void>
  setTokens: (access: string, refresh: string, user: Usuario) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      accessToken:     null,
      refreshToken:    null,
      isAuthenticated: false,
      isAdmin:         false,

      setTokens(access, refresh, user) {
        localStorage.setItem('access_token',  access)
        localStorage.setItem('refresh_token', refresh)
        set({ user, accessToken: access, refreshToken: refresh,
              isAuthenticated: true, isAdmin: ['admin','moderador'].includes(user.papel) })
      },

      async login(email, senha) {
        const { data } = await authService.login({ email, senha })
        const { access_token, refresh_token, user } = data.data
        get().setTokens(access_token, refresh_token, user)
      },

      async register(nome, email, senha) {
        const { data } = await authService.register({ nome, email, senha })
        const { access_token, refresh_token, user } = data.data
        get().setTokens(access_token, refresh_token, user)
      },

      async logout() {
        try { await authService.logout() } catch { /* ignore */ }
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null,
              isAuthenticated: false, isAdmin: false })
      },
    }),
    {
      name: 'splitflix-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }),
    }
  )
)
