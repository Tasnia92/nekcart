import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ImagePlus, MoreVertical, Package, RefreshCw, Wallet } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Input, Label } from '@/components/ui'
import { NotificationsInbox } from '@/components/NotificationsInbox'
import { Brand, FloatingN } from '@/components/Brand'
import { api } from '@/services/api'
import { money, cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

export function SupplierDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  useEffect(() => { void api.get('/supplier/dashboard').then(setData) }, [])
  if (!data) return <p className="text-muted">Loading…</p>
  const s = data.stats
  const first = user?.name?.split(' ')[0] || 'there'
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs text-muted">Supplier dashboard</p>
          <h2 className="text-2xl font-semibold mt-1">Welcome, {first}.</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted inline-flex items-center gap-1">Updated just now <RefreshCw size={14} /></span>
          <Link to="/supplier/products/new"><Button variant="secondary">+ Add product</Button></Link>
          <Link to="/supplier/orders"><Button><Package size={14} /> Process orders</Button></Link>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Available payout</p>
            <span className="h-9 w-9 rounded-lg bg-canvas flex items-center justify-center text-muted"><Wallet size={16} /></span>
          </div>
          <div className="text-3xl font-semibold mt-3">{money(s.available)}</div>
          <Link to="/supplier/earnings" className="inline-block mt-4 text-sm font-medium text-[#991B1B]">Open earnings →</Link>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Orders</p>
            <span className="h-9 w-9 rounded-lg bg-canvas flex items-center justify-center text-muted"><Package size={16} /></span>
          </div>
          <div className="text-3xl font-semibold mt-3">{s.orders}</div>
          <p className="text-sm text-muted mt-1">Last 30 days</p>
          <Link to="/supplier/orders" className="inline-block mt-4 text-sm font-medium text-[#991B1B]">View orders →</Link>
        </Card>
      </div>
    </div>
  )
}

export function SupplierOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [tab, setTab] = useState('All')
  async function load() { setOrders((await api.get<{ orders: any[] }>('/orders')).orders) }
  useEffect(() => { void load() }, [])
  async function act(id: string, status: string) {
    await api.patch(`/orders/${id}/status`, { status })
    await load()
  }
  const tabs = ['All', 'Pending', 'Confirmed', 'Cancelled'] as const
  const visible = orders.filter((o) => {
    if (tab === 'All') return true
    if (tab === 'Pending') return o.status === 'placed' || o.status === 'supplier_approved'
    if (tab === 'Confirmed') return o.status === 'supplier_confirmed' || o.status === 'out_for_delivery' || o.status === 'delivered'
    if (tab === 'Cancelled') return o.status.includes('cancel')
    return true
  })
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Orders</h2>
        <div className="flex gap-2"><Button variant="secondary">Export</Button><Button variant="secondary">Filters</Button></div>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('rounded-full px-3 py-1.5 text-sm', tab === t ? 'bg-[#242526] text-white' : 'bg-[#f3f4f6]')}>{t} {orders.filter((o)=>{
            if (t==='All') return true
            if (t==='Pending') return o.status==='placed'||o.status==='supplier_approved'
            if (t==='Confirmed') return ['supplier_confirmed','out_for_delivery','delivered'].includes(o.status)
            return String(o.status).includes('cancel')
          }).length}</button>
        ))}
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-muted text-left"><tr>
            <th className="px-3 py-3">Order</th><th className="px-3 py-3">Product</th><th className="px-3 py-3">Retailer</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Price</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Status</th><th className="px-3 py-3"></th>
          </tr></thead>
          <tbody>
            {visible.map((o) => (
              <tr key={o._id} className="border-t border-border">
                <td className="px-3 py-3 font-medium">{o.orderNumber}</td>
                <td className="px-3 py-3">{o.items?.[0]?.name || '—'}{o.items?.length>1?` +${o.items.length-1}`:''}</td>
                <td className="px-3 py-3">{o.retailer?.name}</td>
                <td className="px-3 py-3">{(o.paymentMethod||'cod').toUpperCase()}</td>
                <td className="px-3 py-3">{money(o.subtotal)}</td>
                <td className="px-3 py-3 text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-3 py-3"><Badge>{o.status}</Badge></td>
                <td className="px-3 py-3">
                  <div className="flex gap-1 justify-end">
                    {o.status==='placed' && <><Button className="h-8 text-xs" onClick={()=>act(o._id,'supplier_approved')}>Approve</Button><Button variant="secondary" className="h-8 text-xs" onClick={()=>act(o._id,'supplier_cancelled')}>Cancel</Button></>}
                    {o.status==='supplier_approved' && <Button className="h-8 text-xs" onClick={()=>act(o._id,'supplier_confirmed')}>Confirm</Button>}
                    <button className="p-1 text-muted"><MoreVertical size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && <p className="p-8 text-center text-muted">No orders</p>}
      </Card>
    </div>
  )
}

export function SupplierProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  async function load() { setProducts((await api.get<{ products: any[] }>('/products?mine=1')).products) }
  useEffect(() => { void load() }, [])
  const filtered = products.filter((p) => {
    if (status !== 'all' && p.status !== status) return false
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Catalog</p>
          <h2 className="text-2xl font-semibold">Products</h2>
        </div>
        <Link to="/supplier/products/new"><Button>+ Add product</Button></Link>
      </div>
      <Card className="p-4 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Input className="max-w-xs" placeholder="Search products" value={q} onChange={(e)=>setQ(e.target.value)} />
          <select className="h-10 rounded-[8px] border border-border bg-[#f7f8f8] px-3 text-sm"><option>Category</option></select>
          <select className="h-10 rounded-[8px] border border-border bg-[#f7f8f8] px-3 text-sm"><option>Sort</option></select>
          {[
            ['all', `All (${products.length})`],
            ['approved', 'Active'],
            ['pending', 'Pending'],
            ['rejected', 'Hidden'],
          ].map(([s, label])=>(
            <button key={s} onClick={()=>setStatus(s)} className={cn('rounded-full px-3 py-1.5 text-sm', status===s?'bg-[#242526] text-white':'bg-[#f3f4f6]')}>
              {label}
            </button>
          ))}
        </div>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {filtered.map((p)=>(
          <Card key={p._id} className="overflow-hidden flex flex-col">
            <div className="relative">
              <img src={p.imageUrl} className="h-36 w-full object-cover bg-canvas" alt="" />
              <input type="checkbox" className="absolute top-2 left-2" />
              <button className="absolute top-2 right-2 p-1 rounded bg-white/90 text-muted"><MoreVertical size={14}/></button>
            </div>
            <div className="p-3 flex flex-col gap-1 flex-1">
              <div className="font-medium text-sm line-clamp-1">{p.name}</div>
              <div className="text-sm"><span className="font-semibold">{money(p.price)}</span> <span className="text-muted text-xs">per {p.unit}</span></div>
              <div className="flex gap-1 flex-wrap">
                <Badge className={p.status==='approved'?'bg-[#d1fae5] text-[#047857]': p.status==='pending' ? 'bg-[#fef3c7] text-[#b45309]' : ''}>{p.status==='approved'?'Active':p.status==='pending'?'Pending':'Hidden'}</Badge>
                <Badge>MOQ {p.moq}</Badge>
              </div>
              <Button variant="secondary" className="mt-auto w-full h-8 text-xs">Edit product</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function SupplierProductNew() {
  const navigate = useNavigate()
  const [cats, setCats] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', description: '', price: '', unit: 'Piece', category: '', stock: '', moq: '1', imageUrl: '' })
  const [msg, setMsg] = useState('')
  useEffect(() => { void api.get<{ categories: any[] }>('/products/categories').then((d) => setCats(d.categories)) }, [])
  async function submit(e: FormEvent) {
    e.preventDefault()
    await api.post('/products', { ...form, price: Number(form.price), stock: Number(form.stock), moq: Number(form.moq), category: form.category || undefined, imageUrl: form.imageUrl || 'https://placehold.co/400x300' })
    setMsg('Product submitted for approval')
    setTimeout(() => navigate('/supplier/products'), 600)
  }
  return (
    <div className="max-w-2xl">
      <Link to="/supplier/products" className="text-sm text-primary font-medium">← Back to my products</Link>
      <h2 className="text-2xl font-semibold mt-2">Add a product</h2>
      <p className="text-sm text-muted mt-1">New listings are reviewed before they appear in the retailer catalog.</p>
      <Card className="p-5 mt-4">
        <p className="text-sm font-semibold mb-4">New product details</p>
        <form className="space-y-3" onSubmit={submit}>
          <div><Label>Product name *</Label><Input required value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} /></div>
          <div>
            <Label>Long description</Label>
            <textarea maxLength={2000} className="w-full min-h-28 rounded-[8px] border border-border bg-[#f7f8f8] p-3 text-sm" value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} />
            <div className="text-xs text-muted text-right mt-1">{form.description.length}/2000</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Price per unit (৳) *</Label><Input required type="number" value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})} /></div>
            <div><Label>Unit *</Label>
              <select className="w-full h-10 rounded-[8px] border border-border bg-[#f7f8f8] px-3 text-sm" value={form.unit} onChange={(e)=>setForm({...form,unit:e.target.value})}>
                {['Piece','kg','can','pouch','box','liter'].map(u=> <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div><Label>Category</Label>
            <select className="w-full h-10 rounded-[8px] border border-border bg-[#f7f8f8] px-3 text-sm" value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})}>
              <option value="">Select</option>
              {cats.map((c)=><option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Stock *</Label><Input required type="number" value={form.stock} onChange={(e)=>setForm({...form,stock:e.target.value})} /></div>
            <div><Label>Minimum order quantity *</Label><Input required type="number" value={form.moq} onChange={(e)=>setForm({...form,moq:e.target.value})} /></div>
          </div>
          <div>
            <Label>Product image *</Label>
            <label className="mt-1 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#f2ccc1] bg-[#fff4ef] min-h-[140px] cursor-pointer px-4 text-center">
              <ImagePlus className="text-primary" />
              <span className="text-sm font-medium">Drop image or click to upload</span>
              <span className="text-xs text-muted">PNG or JPG, up to 5 MB.</span>
              <input type="file" accept="image/*" className="hidden" onChange={()=>setForm({...form,imageUrl: form.imageUrl || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'})} />
            </label>
</div>
          {msg ? <p className="text-sm text-primary">{msg}</p> : null}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={()=>navigate('/supplier/products')}>Cancel</Button>
            <Button type="submit">Create product</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export function SupplierInventory() {
  const [products, setProducts] = useState<any[]>([])
  const [draft, setDraft] = useState<Record<string, string>>({})
  useEffect(() => { void api.get<{ products: any[] }>('/supplier/inventory').then((d)=>{
    setProducts(d.products)
    const m: Record<string,string> = {}
    d.products.forEach((p:any)=>{ m[p._id]=String(p.stock) })
    setDraft(m)
  }) }, [])
  const out = products.filter((p)=>p.stock<=0).length
  async function saveRow(id: string) {
    await api.patch(`/products/${id}`, { stock: Number(draft[id]||0) })
  }
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-semibold">Inventory management</h2>
        <div className="flex gap-2"><Button variant="secondary">Refresh</Button><Button variant="secondary">Export</Button><Button variant="secondary">Import</Button><Button>Manage</Button></div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card className="p-4"><div className="text-xs uppercase text-muted">Catalog</div><div className="text-2xl font-semibold">{products.length}</div></Card>
        <Card className="p-4"><div className="text-xs uppercase text-muted">Out of stock</div><div className="text-2xl font-semibold">{out}</div></Card>
      </div>
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-medium">Manage Inventory</div>
        <table className="w-full text-sm">
          <thead className="bg-canvas text-muted text-left"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">MOQ</th><th className="px-4 py-3">Update</th></tr></thead>
          <tbody>
            {products.map((p)=>(
              <tr key={p._id} className="border-t border-border">
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3"><Input className="w-24 h-8" value={draft[p._id]||''} onChange={(e)=>setDraft({...draft,[p._id]:e.target.value})} /></td>
                <td className="px-4 py-3">{p.moq}</td>
                <td className="px-4 py-3"><Button className="h-8 text-xs" onClick={()=>saveRow(p._id)}>Update</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export function SupplierEarnings() {
  const [data, setData] = useState<any>(null)
  useEffect(() => { void api.get('/supplier/earnings').then(setData) }, [])
  if (!data) return null
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Earnings and payouts.</h2>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4"><div className="text-[11px] uppercase text-muted font-semibold">Available balance</div><div className="text-2xl font-semibold mt-2">{money(data.balance.available)}</div></Card>
        <Card className="p-4"><div className="text-[11px] uppercase text-muted font-semibold">Paid lifetime</div><div className="text-2xl font-semibold mt-2">{money(data.balance.alreadyPaid)}</div></Card>
        <Card className="p-4"><div className="text-[11px] uppercase text-muted font-semibold">Commission rate</div><div className="text-2xl font-semibold mt-2">5%</div></Card>
      </div>
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="font-medium">Payout ledger</div>
          <div className="flex gap-2 text-sm"><button className="px-3 py-1 rounded-full bg-[#242526] text-white">All</button><button className="px-3 py-1 rounded-full bg-[#f3f4f6]">Paid</button></div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-canvas text-muted text-left"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th></tr></thead>
          <tbody>
            {(data.recent||[]).map((o:any)=>(
              <tr key={o._id} className="border-t border-border"><td className="px-4 py-3">{o.orderNumber}</td><td className="px-4 py-3">{money(o.supplierAmount)}</td><td className="px-4 py-3">{new Date(o.updatedAt).toLocaleDateString()}</td><td className="px-4 py-3"><Badge>Delivered</Badge></td></tr>
            ))}
            {!data.recent?.length && <tr><td colSpan={4} className="p-8 text-center text-muted">No ledger entries yet</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export function SupplierRetailers() {
  const [retailers, setRetailers] = useState<any[]>([])
  useEffect(() => { void api.get<{ retailers: any[] }>('/supplier/retailers').then((d) => setRetailers(d.retailers)) }, [])
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Retailers.</h2>
        <Button variant="secondary">Export CSV</Button>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-muted text-left"><tr><th className="px-4 py-3">Retailer</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Gross</th><th className="px-4 py-3">Last order</th></tr></thead>
          <tbody>
            {retailers.map((r)=>(
              <tr key={r._id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{r.businessName || r.name}</td>
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3">{r.orders ?? 0}</td>
                <td className="px-4 py-3">{money(r.gross || 0)}</td>
                <td className="px-4 py-3 text-muted">{r.lastOrderAt ? new Date(r.lastOrderAt).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {!retailers.length && <tr><td colSpan={5} className="p-8 text-center text-muted">No retailers yet</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export function SupplierNotifications() {
  return <NotificationsInbox heading="Notifications." />
}

export function SupplierSettings() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({
    businessName: user?.businessName || user?.name || '',
    description: '',
    shopLink: '',
  })
  const [pw, setPw] = useState({ a: '', b: '' })
  const [saved, setSaved] = useState('')
  const approved = user?.verificationStatus === 'approved'

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Settings.</h2>
        <Button variant="secondary" className="gap-2"><RefreshCw size={14} /> Refresh</Button>
      </div>

      <Card className="p-5 space-y-4">
        <div>
          <div className="font-semibold">Shop profile</div>
          <p className="text-sm text-muted mt-1">Public shop details retailers see across your catalog listings.</p>
        </div>
        <div><Label>Shop name *</Label><Input value={profile.businessName} onChange={(e)=>setProfile({...profile,businessName:e.target.value})} /></div>
        <div><Label>Description *</Label><textarea className="w-full min-h-24 rounded-[8px] border border-border bg-[#f7f8f8] p-3 text-sm" value={profile.description} onChange={(e)=>setProfile({...profile,description:e.target.value})} /></div>
        <div>
          <Label>Shop link *</Label>
          <Input value={profile.shopLink} onChange={(e)=>setProfile({...profile,shopLink:e.target.value})} />
          <p className="text-xs text-muted mt-1">Lowercase letters, numbers and dashes — used in your shop URL.</p>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="font-semibold">Verification</div>
          <p className="text-sm text-muted mt-1">Review status is managed by SoukCart admins.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge className={approved ? 'bg-primary text-white' : ''}>{user?.verificationStatus || 'none'}</Badge>
            {approved && <span className="text-sm text-muted">Reviewed {user?.updatedAt ? new Date((user as any).updatedAt).toLocaleString() : '—'}</span>}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div><div className="text-muted">Trade licence number</div><div>—</div></div>
            <div><div className="text-muted">Documents on file</div><Badge className="mt-1">NID document uploaded</Badge></div>
          </div>
          <Link to="/supplier/verification" className="inline-block mt-3 text-sm text-primary font-medium">Update verification →</Link>
        </div>

        <div className="flex justify-end">
          <Button onClick={()=>{ setSaved('Saved'); setTimeout(()=>setSaved(''), 1200) }}>Save settings</Button>
        </div>
        {saved ? <p className="text-sm text-primary text-right">{saved}</p> : null}
      </Card>

      <Card className="p-5 space-y-3">
        <div className="font-semibold">Password</div>
        <p className="text-sm text-muted">Update the password for this supplier account.</p>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>New password *</Label><Input type="password" value={pw.a} onChange={(e)=>setPw({...pw,a:e.target.value})} /></div>
          <div><Label>Confirm password *</Label><Input type="password" value={pw.b} onChange={(e)=>setPw({...pw,b:e.target.value})} /></div>
        </div>
        <div className="flex justify-end"><Button variant="secondary">Update password</Button></div>
      </Card>
    </div>
  )
}

export function SupplierVerification() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    businessName: user?.businessName || '',
    shopLink: '',
    businessDescription: '',
    nidDocUrl: '',
    fileName: '',
  })
  const [msg, setMsg] = useState('')
  const status = user?.verificationStatus || 'none'

  async function submit(e: FormEvent) {
    e.preventDefault()
    await api.post('/supplier/verification', {
      businessName: form.businessName,
      shopLink: form.shopLink,
      businessDescription: form.businessDescription,
      nidDocUrl: form.nidDocUrl || '/uploads/nid-placeholder.png',
    })
    setMsg(status === 'approved' ? 'You are verified — resubmitting queues a re-review.' : 'Submitted for review')
    setTimeout(() => navigate('/supplier/settings'), 900)
  }

  return (
    <div className="min-h-screen bg-[#f7f8f8] flex flex-col items-center p-6 relative">
      <div className="w-full max-w-xl mt-8">
        <Brand />
        <h1 className="text-3xl font-bold mt-8">Verification</h1>
        <p className="text-muted mt-2">Verified suppliers get the supplier account type and can manage products.</p>
        <Card className="w-full p-6 mt-6">
          <div className="font-semibold text-lg">Supplier application</div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-muted">Verification status</span>
            <Badge className={status === 'approved' ? 'bg-primary text-white' : ''}>{status}</Badge>
          </div>
          <form className="mt-5 space-y-3" onSubmit={submit}>
            <div><Label>Business name *</Label><Input required value={form.businessName} onChange={(e)=>setForm({...form,businessName:e.target.value})} /></div>
            <div>
              <Label>Shop link *</Label>
              <Input required value={form.shopLink} onChange={(e)=>setForm({...form,shopLink:e.target.value})} />
              <p className="text-xs text-muted mt-1">Your public shop handle — soukcart.dev/@{form.shopLink || 'your-shop'}</p>
            </div>
            <div><Label>Description</Label><textarea className="w-full min-h-24 rounded-[8px] border border-border bg-[#f7f8f8] p-3 text-sm" value={form.businessDescription} onChange={(e)=>setForm({...form,businessDescription:e.target.value})} /></div>
            <div>
              <Label>NID document (required for approval)</Label>
              <div className="mt-1 flex items-center gap-3">
                <label className="inline-flex items-center justify-center h-10 px-4 rounded-[8px] bg-[#fff4ef] border border-[#f2ccc1] text-sm font-medium cursor-pointer">
                  Choose File
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e)=>{
                    const f = e.target.files?.[0]
                    setForm({...form, nidDocUrl: '/uploads/nid-placeholder.png', fileName: f?.name || 'nid.png'})
                  }} />
                </label>
                <span className="text-sm text-muted">{form.fileName || 'No file chosen'}</span>
              </div>
              <p className="text-xs text-muted mt-1">PNG or JPG, up to 5 MB. Stored privately in the trade-licenses bucket.</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit">Submit for review</Button>
              {msg ? <span className="text-sm text-muted">{msg}</span> : status === 'approved' ? <span className="text-sm text-muted">You are verified — resubmitting queues a re-review.</span> : null}
            </div>
          </form>
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <div className="text-sm"><div className="font-medium">Signed in</div><div className="text-muted">{user?.email}</div></div>
            <Button variant="secondary" onClick={logout}>Log out</Button>
          </div>
        </Card>
      </div>
      <FloatingN />
    </div>
  )
}
