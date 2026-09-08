import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MoreVertical, RefreshCw } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Input, Label } from '@/components/ui'
import { NotificationsInbox } from '@/components/NotificationsInbox'
import { api } from '@/services/api'
import { money, cn } from '@/lib/utils'

function statusTone(status: string) {
  if (String(status).includes('cancel')) return 'bg-[#f6b2be] text-[#e84461]'
  if (status === 'delivered') return 'bg-[#d1fae5] text-[#047857]'
  if (status === 'out_for_delivery') return 'bg-[#dbeafe] text-[#1d4ed8]'
  if (status === 'placed' || status === 'pending') return 'bg-[#fef3c7] text-[#b45309]'
  if (status === 'approved') return 'bg-[#d1fae5] text-[#047857]'
  return 'bg-[#f3f4f6]'
}

export function AdminHome() {
  const [stats, setStats] = useState<any>(null)
  useEffect(() => { void api.get<{ stats: any }>('/admin/dashboard').then((d) => setStats(d.stats)) }, [])
  if (!stats) return null
  const trend = stats.trend || []
  const max = Math.max(1, ...trend.map((x: any) => x.count))
  const cards = [
    { k: 'Order value', v: money(stats.revenueSubtotal), sub: `${stats.orders} orders`, link: '/admin/orders', cta: 'View orders →' },
    { k: 'Collected revenue', v: money(stats.commission), sub: 'Platform commission', link: '/admin/payouts', cta: 'Open finance →' },
    { k: 'Open disputes', v: stats.openComplaints, sub: 'Needs review', link: '/admin/disputes', cta: 'Review →' },
    { k: 'Pending verifications', v: stats.pendingVerifications, sub: `${stats.pendingProducts} products pending`, link: '/admin/verifications', cta: 'Review →' },
  ]
  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Marketplace at a glance.</h2>
          <p className="text-sm text-muted mt-1">Monitor orders, revenue, disputes, and supplier approvals.</p>
        </div>
        <Button variant="secondary" className="gap-2" onClick={() => api.get<{ stats: any }>('/admin/dashboard').then((d) => setStats(d.stats))}><RefreshCw size={14} /> Refresh</Button>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <Card key={c.k} className="p-4">
            <div className="text-[11px] uppercase tracking-wide text-muted font-semibold">{c.k}</div>
            <div className="text-2xl font-semibold mt-2">{c.v}</div>
            <div className="text-xs text-muted mt-1">{c.sub}</div>
            <Link to={c.link} className="inline-block mt-3 text-sm font-medium text-[#991B1B]">{c.cta}</Link>
          </Card>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4"><div className="text-xs text-muted">Users</div><div className="text-xl font-semibold">{stats.users}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted">Products</div><div className="text-xl font-semibold">{stats.products}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted">Pending products</div><div className="text-xl font-semibold">{stats.pendingProducts}</div></Card>
      </div>
      <Card className="p-5">
        <div className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-2">Trend · Orders per day</div>
        <div className="h-44 flex items-end gap-2">
          {trend.map((day: any) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full rounded-t-md bg-nav-wash border border-[#f2ccc1]" style={{ height: `${Math.max(8, (day.count / max) * 100)}%` }} title={`${day.count} orders`} />
              <div className="text-[10px] text-muted">{day.date.slice(5)}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-muted">Last 7 days from live order data</div>
      </Card>
    </div>
  )
}

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [tab, setTab] = useState('All')
  async function load() { setOrders((await api.get<{ orders: any[] }>('/orders')).orders) }
  useEffect(() => { void load() }, [])
  async function act(id: string, status: string) { await api.patch(`/orders/${id}/status`, { status }); await load() }
  const tabs = ['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled']
  const visible = orders.filter((o) => {
    if (tab === 'All') return true
    if (tab === 'Pending') return ['placed', 'supplier_approved', 'supplier_confirmed'].includes(o.status)
    if (tab === 'Shipped') return o.status === 'out_for_delivery'
    if (tab === 'Delivered') return o.status === 'delivered'
    return String(o.status).includes('cancel')
  })
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Orders</h2>
        <Button variant="secondary">Filters</Button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('rounded-full px-3 py-1.5 text-sm', tab === t ? 'bg-[#242526] text-white' : 'bg-[#f3f4f6]')}>{t}</button>
        ))}
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-muted text-left"><tr>
            <th className="px-3 py-3">Order</th><th className="px-3 py-3">Retailer</th><th className="px-3 py-3">Supplier</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Status</th><th className="px-3 py-3"></th>
          </tr></thead>
          <tbody>
            {visible.map((o) => (
              <tr key={o._id} className="border-t border-border">
                <td className="px-3 py-3 font-medium">{o.orderNumber}</td>
                <td className="px-3 py-3">{o.retailer?.name}</td>
                <td className="px-3 py-3">{o.supplier?.businessName || o.supplier?.name}</td>
                <td className="px-3 py-3">{money(o.subtotal)}</td>
                <td className="px-3 py-3"><Badge className={statusTone(o.status)}>{o.status}</Badge></td>
                <td className="px-3 py-3 text-right">
                  {o.status === 'supplier_confirmed' && <Button className="h-8 text-xs" onClick={() => act(o._id, 'out_for_delivery')}>Out for delivery</Button>}
                  {o.status === 'out_for_delivery' && <Button className="h-8 text-xs" onClick={() => act(o._id, 'delivered')}>Mark delivered</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && <p className="p-8 text-center text-muted">No matching orders</p>}
      </Card>
    </div>
  )
}

export function AdminRefunds() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Refund</h2>
        <Button variant="secondary">Filters</Button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled'].map((t) => (
          <button key={t} className={cn('rounded-full px-3 py-1.5 text-sm', t === 'All' ? 'bg-[#242526] text-white' : 'bg-[#f3f4f6]')}>{t}</button>
        ))}
      </div>
      <Card><EmptyState title="No matching orders" body="Refund queue reuses Orders chrome — empty until refunds exist." /></Card>
    </div>
  )
}

export function AdminPayouts() {
  const [data, setData] = useState<any>(null)
  const [ratePct, setRatePct] = useState('5')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  async function load() {
    const d = await api.get('/admin/payouts')
    setData(d)
    setRatePct(String(Math.round(Number((d as any).commissionRate || 0) * 1000) / 10))
  }
  useEffect(() => { void load() }, [])
  async function saveRate(e: FormEvent) {
    e.preventDefault()
    setMsg('')
    await api.patch('/admin/commission', { commissionRate: Number(ratePct) / 100 })
    setMsg(`Commission saved at ${ratePct}% (applies to new orders).`)
    await load()
  }
  async function payNow(supplierId: string) {
    setBusy(true)
    setMsg('')
    try {
      await api.post('/admin/payouts', { supplierId, status: 'paid' })
      setMsg('Payout marked paid.')
      await load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Pay failed')
    } finally {
      setBusy(false)
    }
  }
  async function runWeekly() {
    setBusy(true)
    setMsg('')
    try {
      const r = await api.post<{ created: number; skipped: number }>('/admin/payouts/weekly', {})
      setMsg(`Weekly batch: ${r.created} pending payout(s), ${r.skipped} skipped.`)
      await load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Weekly run failed')
    } finally {
      setBusy(false)
    }
  }
  async function markPaid(id: string) {
    setBusy(true)
    try {
      await api.patch(`/admin/payouts/${id}/pay`, {})
      await load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Mark paid failed')
    } finally {
      setBusy(false)
    }
  }
  if (!data) return null
  const earned = data.balances.reduce((s: number, b: any) => s + (b.earned || 0), 0)
  const available = data.balances.reduce((s: number, b: any) => s + (b.available || 0), 0)
  const pendingBatch = data.balances.reduce((s: number, b: any) => s + (b.pendingPayouts || 0), 0)
  const paid = data.balances.reduce((s: number, b: any) => s + (b.alreadyPaid || 0), 0)
  const rate = Number(data.commissionRate || 0)
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">Finance</p>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-semibold">Commission and payouts.</h2>
        <Button disabled={busy} onClick={() => void runWeekly()}>Process weekly payouts</Button>
      </div>
      {msg ? <p className="text-sm text-muted mb-3">{msg}</p> : null}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <Card className="p-4"><div className="text-xs uppercase text-muted">Commission rate</div><div className="text-2xl font-semibold mt-1">{(rate * 100).toFixed(1)}%</div></Card>
        <Card className="p-4"><div className="text-xs uppercase text-muted">Supplier earned</div><div className="text-2xl font-semibold mt-1">{money(earned)}</div></Card>
        <Card className="p-4"><div className="text-xs uppercase text-muted">Available to pay</div><div className="text-2xl font-semibold mt-1">{money(available)}</div></Card>
        <Card className="p-4"><div className="text-xs uppercase text-muted">Paid out</div><div className="text-2xl font-semibold mt-1">{money(paid)}</div></Card>
      </div>
      <Card className="p-4 mb-4 max-w-lg">
        <p className="text-sm text-muted mb-2">Platform commission on merchandise (delivery fee excluded). Applies to <span className="font-medium text-foreground">new</span> orders only.</p>
        <form onSubmit={saveRate} className="flex gap-2 items-end">
          <div className="flex-1"><Label>Rate (%)</Label><Input value={ratePct} onChange={(e) => setRatePct(e.target.value)} placeholder="5" /></div>
          <Button type="submit">Save rate</Button>
        </form>
        <p className="text-xs text-muted mt-2">Pending weekly batches: {money(pendingBatch)}</p>
      </Card>
      <Card className="overflow-hidden mb-6">
        <div className="px-4 py-3 font-medium border-b border-border">Supplier balances (delivered + paid only)</div>
        <table className="w-full text-sm">
          <thead className="bg-canvas text-muted text-left"><tr><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Earned</th><th className="px-4 py-3">Paid</th><th className="px-4 py-3">Pending batch</th><th className="px-4 py-3">Available</th><th className="px-4 py-3"></th></tr></thead>
          <tbody>
            {data.balances.map((b: any) => (
              <tr key={b.supplier._id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{b.supplier.businessName || b.supplier.name}</td>
                <td className="px-4 py-3">{money(b.earned)}</td>
                <td className="px-4 py-3">{money(b.alreadyPaid)}</td>
                <td className="px-4 py-3">{money(b.pendingPayouts || 0)}</td>
                <td className="px-4 py-3">{money(b.available)}</td>
                <td className="px-4 py-3 text-right">
                  <Button className="h-8 text-xs" disabled={busy || b.available <= 0} onClick={() => void payNow(b.supplier._id)}>Pay now</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="overflow-hidden">
        <div className="px-4 py-3 font-medium border-b border-border">Payout ledger</div>
        <table className="w-full text-sm">
          <thead className="bg-canvas text-muted text-left"><tr><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Net to supplier</th><th className="px-4 py-3">Commission</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th><th className="px-4 py-3"></th></tr></thead>
          <tbody>
            {data.payouts.map((p: any) => (
              <tr key={p._id} className="border-t border-border">
                <td className="px-4 py-3">{p.supplier?.businessName || p.supplier?.name}</td>
                <td className="px-4 py-3">{money(p.amount)}</td>
                <td className="px-4 py-3">{money(p.commissionTotal || 0)}</td>
                <td className="px-4 py-3">{p.orderIds?.length || 0}</td>
                <td className="px-4 py-3"><Badge>{p.status}</Badge></td>
                <td className="px-4 py-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  {p.status === 'pending' && (
                    <Button className="h-8 text-xs" disabled={busy} onClick={() => void markPaid(p._id)}>Mark paid</Button>
                  )}
                </td>
              </tr>
            ))}
            {!data.payouts.length && <tr><td colSpan={7} className="p-8 text-center text-muted">No payouts yet</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export function AdminDisputes() {
  const [items, setItems] = useState<any[]>([])
  const [q, setQ] = useState('')
  async function load() { setItems((await api.get<{ complaints: any[] }>('/admin/complaints')).complaints) }
  useEffect(() => { void load() }, [])
  const filtered = items.filter((c) => !q || c.subject.toLowerCase().includes(q.toLowerCase()))
  const open = items.filter((c) => c.status === 'open').length
  const review = items.filter((c) => c.status === 'in_review').length
  const resolved = items.filter((c) => c.status === 'resolved').length
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Disputes</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          ['Total', items.length],
          ['Open', open],
          ['In review', review],
          ['Resolved', resolved],
        ].map(([k, v]) => (
          <Card key={String(k)} className="p-3"><div className="text-xs text-muted">{k}</div><div className="text-xl font-semibold">{v}</div></Card>
        ))}
      </div>
      <Input className="max-w-sm mb-4" placeholder="Search complaints" value={q} onChange={(e) => setQ(e.target.value)} />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-muted text-left"><tr><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Reporter</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c._id} className="border-t border-border">
                <td className="px-4 py-3"><div className="font-medium">{c.subject}</div><div className="text-xs text-muted line-clamp-1">{c.message}</div></td>
                <td className="px-4 py-3">{c.reporter?.email}</td>
                <td className="px-4 py-3"><Badge>{c.status}</Badge></td>
                <td className="px-4 py-3 flex gap-2">
                  <Button variant="secondary" className="h-8 text-xs" onClick={() => api.patch(`/admin/complaints/${c._id}`, { status: 'in_review' }).then(load)}>In review</Button>
                  <Button className="h-8 text-xs" onClick={() => api.patch(`/admin/complaints/${c._id}`, { status: 'resolved' }).then(load)}>Resolve</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState title="No disputes" />}
      </Card>
    </div>
  )
}

export function AdminProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('newest')
  const [preview, setPreview] = useState<string | null>(null)
  async function load() { setProducts((await api.get<{ products: any[] }>('/products')).products) }
  useEffect(() => { void load() }, [])
  const stats = useMemo(() => ({
    total: products.length,
    pending: products.filter((p) => p.status === 'pending').length,
    active: products.filter((p) => p.status === 'approved').length,
    rejected: products.filter((p) => p.status === 'rejected').length,
  }), [products])
  const visible = useMemo(() => {
    let list = products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.supplier?.businessName || p.supplier?.name || '').toLowerCase().includes(q.toLowerCase()))
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'newest') list = [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    if (sort === 'status') list = [...list].sort((a, b) => a.status.localeCompare(b.status))
    return list
  }, [products, q, sort])

  async function removeProduct(p: any) {
    if (!window.confirm(`Delete product "${p.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/products/${p._id}`)
      await load()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Product moderation.</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
        {[
          ['Total', stats.total],
          ['Pending', stats.pending],
          ['Active', stats.active],
          ['Rejected', stats.rejected],
          ['Hidden', 0],
          ['Flagged', 0],
        ].map(([k, v]) => (
          <Card key={String(k)} className="p-3"><div className="text-xs text-muted">{k}</div><div className="text-xl font-semibold">{v}</div></Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Input className="max-w-xs" placeholder="Search products or suppliers" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="h-10 rounded-[8px] border border-border bg-[#f7f8f8] px-3 text-sm" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="name">Name A–Z</option>
          <option value="status">Status</option>
        </select>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-muted text-left"><tr><th className="px-3 py-3">Product</th><th className="px-3 py-3">Supplier</th><th className="px-3 py-3">Price</th><th className="px-3 py-3">Status</th><th className="px-3 py-3"></th></tr></thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p._id} className="border-t border-border">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <button
                      type="button"
                      className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-canvas"
                      onClick={() => p.imageUrl && setPreview(p.imageUrl)}
                      title={p.imageUrl ? 'View image' : 'No image'}
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[10px] text-muted">No img</span>
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted">{p.unit} · MOQ {p.moq}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">{p.supplier?.businessName || p.supplier?.name}</td>
                <td className="px-3 py-3">{money(p.price)}</td>
                <td className="px-3 py-3"><Badge className={statusTone(p.status)}>{p.status}</Badge></td>
                <td className="px-3 py-3 text-right">
                  <div className="flex gap-2 justify-end flex-wrap">
                    {p.status === 'pending' && (
                      <>
                        <Button className="h-8 text-xs" onClick={() => api.patch(`/products/${p._id}/moderate`, { status: 'approved' }).then(load)}>Approve</Button>
                        <Button variant="secondary" className="h-8 text-xs" onClick={() => api.patch(`/products/${p._id}/moderate`, { status: 'rejected' }).then(load)}>Reject</Button>
                      </>
                    )}
                    <Button variant="danger" className="h-8 text-xs" onClick={() => void removeProduct(p)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreview(null)}>
          <img src={preview} alt="Product" className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      ) : null}
    </div>
  )
}

export function AdminCategories() {
  const [cats, setCats] = useState<any[]>([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  async function load() { setCats((await api.get<{ categories: any[] }>('/products/categories?all=1')).categories) }
  useEffect(() => { void load() }, [])
  async function add(e: FormEvent) { e.preventDefault(); await api.post('/products/categories', { name }); setName(''); await load() }
  async function saveEdit(id: string) {
    await api.patch(`/products/categories/${id}`, { name: editName })
    setEditing(null)
    await load()
  }
  async function hide(id: string, isActive: boolean) {
    await api.patch(`/products/categories/${id}`, { isActive: !isActive })
    await load()
  }
  async function remove(id: string) {
    await api.delete(`/products/categories/${id}`)
    await load()
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Categories</h2>
        <form onSubmit={add} className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category" required />
          <Button type="submit">+ Add category</Button>
        </form>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="p-3"><div className="text-xs text-muted">Total</div><div className="text-xl font-semibold">{cats.length}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted">Active</div><div className="text-xl font-semibold">{cats.filter((c)=>c.isActive !== false).length}</div></Card>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-muted text-left"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c._id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">
                  {editing === c._id ? (
                    <Input className="h-8" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  ) : c.name}
                </td>
                <td className="px-4 py-3 text-muted">{c.slug}</td>
                <td className="px-4 py-3"><Badge>{c.isActive === false ? 'Hidden' : 'Active'}</Badge></td>
                <td className="px-4 py-3">
                  {editing === c._id ? (
                    <Button className="h-8 text-xs mr-2" onClick={() => saveEdit(c._id)}>Save</Button>
                  ) : (
                    <Button variant="secondary" className="h-8 text-xs mr-2" onClick={() => { setEditing(c._id); setEditName(c.name) }}>Edit</Button>
                  )}
                  <Button variant="secondary" className="h-8 text-xs mr-2" onClick={() => hide(c._id, c.isActive !== false)}>{c.isActive === false ? 'Show' : 'Hide'}</Button>
                  <Button variant="ghost" className="h-8 text-xs" onClick={() => remove(c._id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export function AdminVerifications() {
  const [users, setUsers] = useState<any[]>([])
  async function load() { setUsers((await api.get<{ users: any[] }>('/admin/verifications')).users) }
  useEffect(() => { void load() }, [])
  const pending = users.filter((u) => u.verificationStatus === 'pending').length
  const approved = users.filter((u) => u.verificationStatus === 'approved').length
  const rejected = users.filter((u) => u.verificationStatus === 'rejected').length
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-1">Supplier applications.</h2>
      <p className="text-sm text-muted mb-4">Review NID and business details before approving suppliers.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          ['Total', users.length],
          ['Pending', pending],
          ['Approved', approved],
          ['Rejected', rejected],
        ].map(([k, v]) => (
          <Card key={String(k)} className="p-3"><div className="text-xs text-muted">{k}</div><div className="text-xl font-semibold">{v}</div></Card>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {users.map((u) => (
          <Card key={u._id} className="p-4 flex flex-col">
            <div className="h-28 rounded-xl bg-[#fff4ef] border border-[#f2ccc1] mb-3 overflow-hidden flex items-center justify-center text-xs text-muted">
              {u.nidDocUrl && (u.nidDocUrl.startsWith('http') || u.nidDocUrl.endsWith('.png') || u.nidDocUrl.endsWith('.jpg')) ? (
                <img src={u.nidDocUrl.startsWith('http') ? u.nidDocUrl : 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400'} alt="NID" className="h-full w-full object-cover" />
              ) : (
                <span>NID document on file</span>
              )}
            </div>
            <div className="font-semibold">{u.businessName || u.name}</div>
            <div className="text-sm text-muted">{u.email}</div>
            <Badge className={cn('mt-2 w-fit', statusTone(u.verificationStatus))}>{u.verificationStatus}</Badge>
            <Link to={`/admin/verifications/${u._id}`} className="mt-auto pt-4 text-sm font-medium text-[#991B1B]">Review application →</Link>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function AdminVerificationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  useEffect(() => {
    void api.get<{ users: any[] }>('/admin/verifications').then((d) => setUser(d.users.find((u) => u._id === id)))
  }, [id])
  if (!user) return <p className="text-muted">Loading…</p>
  async function decide(status: string) {
    await api.patch(`/admin/verifications/${id}`, { status })
    navigate('/admin/verifications')
  }
  return (
    <div>
      <button onClick={() => navigate('/admin/verifications')} className="text-sm text-primary font-medium">← Back to applications</button>
      <h2 className="text-2xl font-semibold mt-2">{user.businessName || user.name}</h2>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <Card className="p-4"><div className="font-semibold mb-2">NID</div><div className="h-48 rounded-xl bg-[#fff4ef] border border-[#f2ccc1] overflow-hidden flex items-center justify-center text-sm text-muted">
          {user.nidDocUrl ? (
            <img src={user.nidDocUrl.startsWith('http') ? user.nidDocUrl : 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600'} alt="NID document" className="h-full w-full object-cover" />
          ) : 'No document'}
        </div></Card>
        <Card className="p-4 space-y-2">
          <div className="font-semibold">Supplier</div>
          <div className="text-sm"><span className="text-muted">Name:</span> {user.name}</div>
          <div className="text-sm"><span className="text-muted">Email:</span> {user.email}</div>
          <div className="text-sm"><span className="text-muted">Shop:</span> {user.shopLink || '—'}</div>
          <div className="font-semibold pt-3">Identity</div>
          <p className="text-sm text-muted">{user.businessDescription || 'No description provided.'}</p>
          <div className="font-semibold pt-3">Review</div>
          <div className="flex gap-2">
            <Button onClick={() => decide('approved')}>Approve</Button>
            <Button variant="secondary" onClick={() => decide('rejected')}>Reject</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  useEffect(() => { void api.get<{ users: any[] }>('/admin/users').then((d) => setUsers(d.users)) }, [])
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">Users</p>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Accounts.</h2>
        <Button>+ New user</Button>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-muted text-left"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Verified</th><th className="px-4 py-3">ID</th><th className="px-4 py-3"></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 rounded-full bg-[#374151] text-white text-xs flex items-center justify-center">{u.name?.charAt(0)}</span>
                    <span className="font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3"><Badge>{u.role}</Badge></td>
                <td className="px-4 py-3">{u.role === 'admin' || u.verificationStatus === 'approved' ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-xs text-muted font-mono">{u._id?.slice(-8)}</td>
                <td className="px-4 py-3 text-right"><button className="p-1 text-muted"><MoreVertical size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export function AdminNotifications() {
  return <NotificationsInbox heading="Notifications." />
}
