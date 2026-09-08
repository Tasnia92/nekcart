import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, Card } from '@/components/ui'
import { useCart } from '@/context/CartContext'
import { api } from '@/services/api'
import { money } from '@/lib/utils'

export function RetailerProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState<any>(null)
  const [qty, setQty] = useState(1)
  const { add } = useCart()

  useEffect(() => {
    void api.get<{ product: any }>(`/products/${id}`).then((d) => {
      setProduct(d.product)
      setQty(d.product.moq || 1)
    })
  }, [id])

  if (!product) return <p className="text-muted">Loading…</p>

  return (
    <div>
      <Link to="/retailer/products" className="text-primary text-sm font-medium">Back to storefront</Link>
      <div className="mt-4 grid md:grid-cols-2 gap-8">
        <img src={product.imageUrl} alt="" className="rounded-2xl border border-border w-full aspect-square object-cover bg-canvas" />
        <div>
          <p className="text-xs uppercase text-muted">Product details</p>
          <h2 className="text-3xl font-semibold mt-1">{product.name}</h2>
          <p className="text-muted mt-1">{product.supplier?.businessName || product.supplier?.name}</p>
          <p className="text-2xl font-semibold mt-4">{money(product.price)} <span className="text-base text-muted">/ {product.unit}</span></p>
          <p className="text-sm text-muted mt-1">MOQ {product.moq} · {product.stock} in stock</p>
          <p className="mt-4 text-sm leading-relaxed">{product.description}</p>
          <div className="mt-6 flex items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-border">
              <button className="h-10 w-10" onClick={() => setQty((q) => Math.max(product.moq, q - 1))}>−</button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button className="h-10 w-10" onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
            <Button
              onClick={() =>
                add(
                  {
                    productId: product._id,
                    name: product.name,
                    price: product.price,
                    unit: product.unit,
                    moq: product.moq,
                    imageUrl: product.imageUrl,
                    supplierId: product.supplier._id,
                  },
                  qty,
                )
              }
            >
              Add to order
            </Button>
          </div>
        </div>
      </div>
      <Card className="mt-8 p-4 text-sm text-muted">Related products appear here once more catalog items share a category.</Card>
    </div>
  )
}
