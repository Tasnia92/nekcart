import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Bell,
  Check,
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeft,
  type LucideIcon,
} from 'lucide-react'
import { Brand } from '@/components/Brand'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { cn } from '@/lib/utils'

export type SideNavItem = {
  to: string
  label: string
  Icon: LucideIcon
  end?: boolean
  badge?: number
}

export function SidebarLayout({
  items,
  roleLabel,
  notificationsTo,
  wide = false,
}: {
  items: SideNavItem[]
  roleLabel: 'Supplier' | 'Admin'
  notificationsTo: string
  bellCount?: number
  wide?: boolean
}) {
  const { user, logout } = useAuth()
  const { unread: bellCount } = useNotifications()
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const pageName = useMemo(() => {
    const hit = [...items].reverse().find((i) =>
      i.end ? location.pathname === i.to : location.pathname === i.to || location.pathname.startsWith(i.to + '/'),
    )
    return hit?.label || roleLabel
  }, [items, location.pathname, roleLabel])

  const initial = (user?.name || 'U').trim().charAt(0).toUpperCase()
  const verified = user?.verificationStatus === 'approved' || user?.role === 'admin'

  return (
    <div
      className={cn(
        'min-h-screen grid bg-canvas',
        collapsed ? 'md:grid-cols-[72px_1fr]' : wide ? 'md:grid-cols-[280px_1fr]' : 'md:grid-cols-[240px_1fr]',
      )}
    >
      <aside className="bg-white border-r border-border p-3 flex flex-col min-h-screen">
        <div className={cn('px-2 mb-3', collapsed && 'px-0 flex justify-center')}>
          {!collapsed ? <Brand /> : <Brand className="scale-90" />}
          {!collapsed && (
            <p className="mt-3 text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">{roleLabel}</p>
          )}
        </div>
        <nav className="flex flex-col gap-0.5">
          {items.map(({ to, label, Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              className={({ isActive }) =>
                cn(
                  'relative rounded-xl px-3 py-2.5 text-sm font-medium text-[#6b7280] hover:bg-nav-wash inline-flex items-center gap-2.5',
                  collapsed && 'justify-center px-2',
                  isActive && 'bg-nav-wash text-[#991B1B]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-[#991B1B]' : 'text-[#9ca3af]'} />
                  {!collapsed && <span>{label}</span>}
                  {!!badge && badge > 0 && (
                    <span className={cn('absolute rounded-full bg-danger text-white text-[10px] min-w-4 h-4 px-1 flex items-center justify-center', collapsed ? 'top-1 right-1' : 'right-2')}>
                      {badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={cn('mt-auto border-t border-border pt-3', collapsed && 'flex justify-center')}>
          {!collapsed ? (
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-canvas text-left"
              title="Account / log out"
            >
              <span className="h-9 w-9 rounded-full bg-[#374151] text-white text-sm font-semibold flex items-center justify-center">
                {initial}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                  {user?.name?.split(' ')[0]}
                  {verified && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted">
                      <Check size={12} className="text-[#6b7280]" /> Verified
                    </span>
                  )}
                </span>
                <span className="block text-[11px] text-muted truncate">{user?.email}</span>
              </span>
              <ChevronsUpDown size={14} className="text-muted" />
            </button>
          ) : (
            <button type="button" onClick={logout} className="h-9 w-9 rounded-full bg-[#374151] text-white text-sm font-semibold">
              {initial}
            </button>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex flex-col">
        <header className="h-14 bg-white border-b border-border flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="p-2 rounded-lg border border-border text-muted hover:bg-canvas"
              aria-label="Toggle sidebar"
            >
              {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            </button>
            <div className="text-muted">
              <span>{roleLabel}</span>
              <span className="mx-1.5">›</span>
              <span className="text-foreground font-medium">{pageName}</span>
            </div>
          </div>
          <Link to={notificationsTo} className="relative p-2 text-muted hover:text-foreground">
            <Bell size={18} />
            {bellCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-danger text-white text-[10px] flex items-center justify-center px-1">
                {bellCount}
              </span>
            )}
          </Link>
        </header>
        <main className="p-6 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
