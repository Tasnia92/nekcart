import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MoreVertical } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { api } from '@/services/api'
import { money, cn } from '@/lib/utils'

const filters = ['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled'] as const

function statusTone(status: string) {
  if (status === 'cancelled' || status === 'supplier_cancelled') return 'bg-[#f6b2be] text-[#e84461]'
  if (status === 'delivered') return 'bg-[#d1fae5] text-[#047857]'
  if (status === 'out_for_delivery') return 'bg-[#dbeafe] text-[#1d4ed8]'
  if (status === 'placed' || status === 'supplier_approved') return 'bg-[#fef3c7] text-[#b45309]'
  return ''
}

function payBadges(o: any) {
  const bits: string[] = []
  if (o.deliveryFeePaid) bits.push('Delivery ৳120 paid')
  if (o.productAmountPaid) bits.push('Products paid')
  else if (o.paymentMethod === 'cod' && o.deliveryFeePaid) bits.push('COD due')
  return bits
}

function mapFilter(status: string, filter: string) {
  if (filter === 'All') return true
  if (filter === 'Pending') return ['placed', 'supplier_approved', 'supplier_confirmed', 'awaiting_payment'].includes(status)
  if (filter === 'Shipped') return status === 'out_for_delivery'
  if (filter === 'Delivered') return status === 'delivered'
  if (filter === 'Cancelled') return ['cancelled', 'supplier_cancelled'].includes(status)
  return true
}

export function RetailerOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')

  async function load() {
    const d = await api.get<{ orders: any[] }>('/orders')
    setOrders(d.orders)
  }

  useEffect(() => { void load() }, [])

  const visible = useMemo(() => orders.filter((o) => mapFilter(o.status, filter)), [orders, filter])

  async function cancel(id: string) {
    await api.patch(`/orders/${id}/status`, { status: 'cancelled' })
    await load()
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-semibold">Orders</h2>
        <Link to="/retailer/products"><Button>+ Place order</Button></Link>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {filters.map((f) => {
          const count = orders.filter((o) => mapFilter(o.status, f)).length
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm',
                filter === f ? 'bg-[#242526] text-white' : 'bg-[#f3f4f6] text-foreground',
              )}
            >
              {f} {count}
            </button>
          )
        })}
        <Button variant="secondary" className="h-8 ml-auto">Filters</Button>
      </div>
      <Card className="overflow-hidden rounded-[12px]">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-muted">
            <tr>
              <th className="px-3 py-3 w-8"><input type="checkbox" /></th>
              <th className="px-3 py-3 font-medium">Order</th>
              <th className="px-3 py-3 font-medium">Product</th>
              <th className="px-3 py-3 font-medium">Type</th>
              <th className="px-3 py-3 font-medium">Price</th>
              <th className="px-3 py-3 font-medium">Date</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((o) => {
              const first = o.items?.[0]
              return (
                <tr key={o._id} className="border-t border-border">
                  <td className="px-3 py-3"><input type="checkbox" /></td>
                  <td className="px-3 py-3 font-medium">{o.orderNumber}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 min-w-[160px]">
                      <img src={first?.imageUrl || 'https://placehold.co/72x72'} alt="" className="h-9 w-9 rounded-md object-cover bg-canvas border border-border" />
                      <div>
                        <div className="font-medium line-clamp-1">{first?.name || '—'}</div>
                        <div className="text-xs text-muted">{o.items?.length || 0} item(s)</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 capitalize">{(o.paymentMethod || 'cod').toUpperCase() === 'COD' ? 'COD' : (o.paymentMethod || 'Online')}</td>
                  <td className="px-3 py-3">{money(o.subtotal)}</td>
                  <td className="px-3 py-3 text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-3">
                    <div className="space-y-1">
                      <Badge className={statusTone(o.status)}>{o.status}</Badge>
                      {payBadges(o).map((b) => (
                        <div key={b} className="text-[11px] text-muted">{b}</div>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="relative group">
                      <button className="p-1 text-muted"><MoreVertical size={16} /></button>
                      {['placed', 'supplier_approved'].includes(o.status) && (
                        <div className="hidden group-hover:block absolute right-0 top-7 z-10 bg-white border border-border rounded-lg shadow-sm p-1 min-w-[120px]">
                          <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-canvas rounded" onClick={() => cancel(o._id)}>Cancel</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!visible.length && <p className="p-8 text-center text-muted">No orders yet.</p>}
      </Card>
    </div>
  )
}
