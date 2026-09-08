import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, Card, EmptyState, Input, Label } from '@/components/ui'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import { money } from '@/lib/utils'

const DELIVERY_FEE = 120

export function RetailerCart() {
  const { items, setQty, remove, clear, subtotal } = useCart()
  const { user } = useAuth()
  const [fullName, setFullName] = useState(user?.name || '')
  const [mobile, setMobile] = useState('')
  useEffect(() => {
    if (user?.name && !fullName) setFullName(user.name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name])
  const [address, setAddress] = useState('')
  const [method, setMethod] = useState<'cod' | 'online'>('cod')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [params] = useSearchParams()

  const dueNow = useMemo(
    () => (method === 'online' ? subtotal + DELIVERY_FEE : DELIVERY_FEE),
    [method, subtotal],
  )

  const contactOk = Boolean(fullName.trim() && mobile.trim() && address.trim())
  const payHint = params.get('pay')
  const payReason = params.get('reason')

  async function payViaSsl() {
    if (!fullName.trim() || !mobile.trim() || !address.trim()) {
      setError('Fill full name, mobile, and full address')
      return
    }
    const digits = mobile.trim().replace(/\s+/g, '')
    if (!/^01\d{9}$/.test(digits)) {
      setError('Mobile must be 11 digits starting with 01')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post<{
        order: { orderNumber: string }
        payment: { redirectUrl: string }
      }>('/orders', {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod: method,
        recipientName: fullName.trim(),
        recipientMobile: digits,
        deliveryAddress: address.trim(),
      })
      const url = res.payment?.redirectUrl
      if (!url) throw new Error('No SSLCommerz redirect URL returned')
      clear()
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment start failed')
      setLoading(false)
    }
  }

  if (!items.length) {
    return (
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">Cart</p>
        <h2 className="text-2xl font-semibold mb-2">Review your order.</h2>
        {payHint === 'fail' || payHint === 'cancel' ? (
          <p className="mb-3 text-sm text-danger">
            Payment {payHint === 'cancel' ? 'cancelled' : 'failed'}. Order was not placed.
            {payReason ? ` (${payReason})` : ''}
          </p>
        ) : null}
        <EmptyState
          title="Your cart is empty"
          body="Browse the catalog and add products to start an order."
          action={<Link to="/retailer/products"><Button>Browse catalog</Button></Link>}
        />
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">Cart</p>
        <h2 className="text-2xl font-semibold mb-1">Review your order.</h2>
        <p className="text-sm text-muted mb-4">Adjust quantities, then continue to delivery and payment.</p>
        <div className="space-y-3">
          {items.map((i) => (
            <Card key={i.productId} className="p-4 flex gap-4 items-center">
              <img src={i.imageUrl} className="h-16 w-16 rounded-lg object-cover bg-canvas" alt="" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{i.name}</div>
                <div className="text-sm text-muted">{money(i.price)} / {i.unit}</div>
                <div className="text-sm font-semibold mt-1">{money(i.price * i.quantity)}</div>
              </div>
              <div className="inline-flex items-center rounded-full border border-border">
                <button type="button" className="h-9 w-9" onClick={() => setQty(i.productId, i.quantity - 1)}>−</button>
                <span className="w-8 text-center text-sm">{i.quantity}</span>
                <button type="button" className="h-9 w-9" onClick={() => setQty(i.productId, i.quantity + 1)}>+</button>
              </div>
              <button type="button" className="text-sm text-muted" onClick={() => remove(i.productId)}>Remove</button>
            </Card>
          ))}
        </div>
        <Link to="/retailer/products" className="inline-block mt-4 text-sm text-primary font-medium">← Back to catalog</Link>
      </div>

      <Card className="p-5 h-fit space-y-4">
        <div className="font-semibold text-lg">Checkout</div>

        <div className="space-y-3">
          <div>
            <Label>Full name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Recipient / shop contact name"
              autoComplete="name"
            />
          </div>
          <div>
            <Label>Mobile</Label>
            <Input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="01XXXXXXXXX"
              autoComplete="tel"
            />
          </div>
          <div>
            <Label>Full address</Label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop name, road, area, city"
              rows={3}
              className="mt-1.5 w-full min-h-[80px] rounded-lg border border-border bg-[#f7f8f8] px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <Label>Payment for products</Label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMethod('cod')}
              className={`h-10 rounded-lg text-sm font-medium border ${
                method === 'cod' ? 'bg-primary text-white border-primary' : 'bg-white border-border text-foreground'
              }`}
            >
              Cash on delivery
            </button>
            <button
              type="button"
              onClick={() => setMethod('online')}
              className={`h-10 rounded-lg text-sm font-medium border ${
                method === 'online' ? 'bg-primary text-white border-primary' : 'bg-white border-border text-foreground'
              }`}
            >
              Pay online
            </button>
          </div>
          <p className="mt-2 text-[12px] text-muted leading-relaxed">
            {method === 'cod'
              ? 'Pay ৳120 delivery fee now. Pay for products in cash when the order arrives.'
              : 'Pay delivery fee and products securely via SSLCommerz.'}
          </p>
        </div>

        <div className="space-y-2 border-t border-border pt-3 text-sm">
          <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Delivery fee</span><span>{money(DELIVERY_FEE)}</span></div>
          <div className="flex justify-between font-semibold text-[15px] pt-1">
            <span>Total due now</span>
            <span className="text-primary">{money(dueNow)}</span>
          </div>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <Button
          className="w-full h-11"
          disabled={loading || !contactOk}
          onClick={() => void payViaSsl()}
        >
          {loading
            ? 'Starting SSLCommerz…'
            : method === 'cod'
              ? `Pay ৳${DELIVERY_FEE} delivery fee`
              : `Pay ${money(dueNow)} with SSLCommerz`}
        </Button>
        <p className="text-[11px] text-muted text-center">
          Order is created only after SSLCommerz payment succeeds.
        </p>
      </Card>
    </div>
  )
}
