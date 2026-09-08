import { Navigate } from 'react-router-dom'
import { useAuth, type Role } from '@/context/AuthContext'
import type { ReactNode } from 'react'

export function Protected({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-10 text-muted">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />
  return children
}
