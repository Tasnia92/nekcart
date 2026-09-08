import { Link, NavLink, Outlet } from 'react-router-dom'
import { Bell, ShoppingCart, Search, Home, Package, Truck, LifeBuoy, UserRound } from 'lucide-react'
import { Brand, FloatingN } from '@/components/Brand'
import { useCart } from '@/context/CartContext'
import { useNotifications } from '@/context/NotificationContext'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/retailer/products', label: 'Home', Icon: Home },
  { to: '/retailer/orders', label: 'Orders', Icon: Package },
  { to: '/retailer/tracking', label: 'Tracking', Icon: Truck },
  { to: '/retailer/help', label: 'Help Center', Icon: LifeBuoy },
  { to: '/retailer/settings', label: 'Account', Icon: UserRound },
]

export function RetailerLayout() {
  const { count } = useCart()
  const { unread } = useNotifications()
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
          <Brand />
          <div className="hidden md:flex flex-1 max-w-xl relative">
            <input
              placeholder="Search products, suppliers..."
              className="w-full h-11 rounded-full bg-[#f7f8f8] border border-border pl-4 pr-11 text-sm"
            />
            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/retailer/notifications" className="relative flex flex-col items-center gap-0.5 text-muted hover:text-foreground">
              <span className="relative">
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4 min-w-4 rounded-full bg-danger text-white text-[10px] flex items-center justify-center px-1">{unread > 99 ? '99+' : unread}</span>
                )}
              </span>
              <span className="text-[11px]">Notification</span>
            </Link>
            <Link to="/retailer/cart" className="relative flex flex-col items-center gap-0.5 text-muted hover:text-foreground">
              <span className="relative">
                <ShoppingCart size={18} />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4 min-w-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center px-1">{count}</span>
                )}
              </span>
              <span className="text-[11px]">Cart</span>
            </Link>
          </div>
        </div>
        <div className="bg-primary text-white">
          <div className="mx-auto max-w-6xl px-4 flex gap-1 overflow-x-auto">
            {nav.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'px-4 py-3 text-sm font-medium whitespace-nowrap inline-flex items-center gap-2',
                    isActive && 'bg-[#f2ccc1] text-foreground rounded-t-md',
                  )
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="bg-[#f9fafb] border-t border-border mt-8">
        <div className="mx-auto max-w-6xl px-4 py-10 grid md:grid-cols-4 gap-6 text-sm">
          <div>
            <Brand />
            <p className="mt-3 text-muted text-[13px]">Stock up from verified suppliers. Track orders. Grow your shop.</p>
          </div>
          <div>
            <div className="font-semibold mb-2">Shop</div>
            <ul className="space-y-1.5 text-muted">
              <li><Link to="/retailer/products">Home</Link></li>
              <li><Link to="/retailer/products">Products</Link></li>
              <li><Link to="/retailer/cart">Cart</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Orders</div>
            <ul className="space-y-1.5 text-muted">
              <li><Link to="/retailer/orders">Orders</Link></li>
              <li><Link to="/retailer/tracking">Tracking</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Support</div>
            <ul className="space-y-1.5 text-muted">
              <li><Link to="/retailer/help">Help Center</Link></li>
              <li><Link to="/retailer/settings">Settings</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 h-12 flex items-center text-[13px] text-muted">
            © 2026 SoukCart. All rights reserved.
          </div>
        </div>
      </footer>
      <FloatingN />
    </div>
  )
}
