import type { ReactNode } from 'react'
import { Brand, FloatingN } from '@/components/Brand'
import { Store, Package, Monitor, Layers, RefreshCw } from 'lucide-react'

export function AuthShell({
  children,
  headline = 'Sell everywhere. Stay in sync.',
  body = 'Connect your storefronts, keep inventory accurate, and spend more time growing your business.',
}: {
  children: ReactNode
  headline?: string
  body?: string
}) {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#f7f8f8]">
      <div className="relative flex flex-col px-6 py-8 md:px-10">
        <Brand />
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-[440px] rounded-2xl border border-border bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
            {children}
          </div>
        </div>
        <FloatingN />
      </div>
      <div className="hidden md:flex bg-primary text-white flex-col justify-between p-12">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-white/90">Why soukcart</p>
          <h2 className="mt-3 text-4xl font-bold leading-tight max-w-md">{headline}</h2>
          <p className="mt-4 text-white/90 max-w-md text-[15px] leading-relaxed">{body}</p>
        </div>
        <div className="my-10 mx-auto w-full max-w-md rounded-2xl bg-white/10 border border-white/15 p-10 flex items-center justify-center min-h-[220px]">
          <div className="relative w-56 h-40">
            <Store className="absolute left-2 top-8 text-white/95" size={42} strokeWidth={1.5} />
            <Store className="absolute right-2 top-8 text-white/95" size={42} strokeWidth={1.5} />
            <Package className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={28} strokeWidth={1.5} />
            <RefreshCw className="absolute left-1/2 top-2 -translate-x-1/2 text-white/80" size={22} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { icon: Monitor, label: 'Storefront sync' },
            { icon: Layers, label: 'Live inventory' },
            { icon: RefreshCw, label: 'Order routing' },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-2 rounded-full bg-white text-foreground px-3 py-1.5 text-sm font-medium">
              <Icon size={14} /> {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function RoleTabs({
  role,
  onChange,
}: {
  role: 'retailer' | 'supplier'
  onChange: (r: 'retailer' | 'supplier') => void
}) {
  return (
    <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-[#f1f3f3]">
      {([
        { id: 'retailer' as const, title: 'Retailer', sub: 'Buy for my shop', Icon: Store },
        { id: 'supplier' as const, title: 'Supplier', sub: 'Sell on SoukCart', Icon: Package },
      ]).map(({ id, title, sub, Icon }) => {
        const active = role === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={
              active
                ? 'rounded-full bg-white shadow-sm px-3 py-2.5 text-left border border-border/60'
                : 'rounded-full px-3 py-2.5 text-left text-muted'
            }
          >
            <span className="flex items-start gap-2">
              <Icon size={16} className={active ? 'text-primary mt-0.5' : 'mt-0.5'} />
              <span>
                <span className="block text-sm font-semibold text-foreground">{title}</span>
                <span className="block text-[11px] text-muted leading-tight">{sub}</span>
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
