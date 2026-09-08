import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '@/services/api'

export type Role = 'retailer' | 'supplier' | 'admin'

export type AuthUser = {
  id: string
  _id?: string
  name: string
  email: string
  role: Role
  verificationStatus?: string
  businessName?: string
}

type AuthState = {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (payload: Record<string, string>) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('nekcart_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const data = await api.get<{ user: AuthUser }>('/auth/me')
        const u = data.user
        setUser({ ...u, id: u.id || String(u._id) })
      } catch {
        localStorage.removeItem('nekcart_token')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  const value = useMemo<AuthState>(() => ({
    user,
    token,
    loading,
    async login(email, password) {
      const data = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password })
      localStorage.setItem('nekcart_token', data.token)
      setToken(data.token)
      setUser({ ...data.user, id: data.user.id })
      return data.user
    },
    async register(payload) {
      const data = await api.post<{ token: string; user: AuthUser }>('/auth/register', payload)
      localStorage.setItem('nekcart_token', data.token)
      setToken(data.token)
      setUser({ ...data.user, id: data.user.id })
      return data.user
    },
    logout() {
      localStorage.removeItem('nekcart_token')
      setToken(null)
      setUser(null)
    },
  }), [user, token, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside provider')
  return ctx
}
