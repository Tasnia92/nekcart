import { Link } from 'react-router-dom'
import { Brand } from '@/components/Brand'
import { Button } from '@/components/ui'
import { ShieldCheck, Tag, Truck, Grid2x2, ClipboardList } from 'lucide-react'

const supplierSteps = [
  'Create Your Account',
  'List Your Products',
  'Receive Orders',
  'Confirm Orders',
  'Grow Your Business',
]
const retailerSteps = [
  'Find Products',
  'Compare & Choose',
  'Place Your Order',
  'Track & Receive',
  'Stock & Grow',
]

export function Landing() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      <header className="border-b border-border/60 relative z-10 bg-white">
        <div className="mx-auto max-w-[1120px] px-4 h-[68px] flex items-center justify-between gap-4">
          <Brand />
          <nav className="hidden md:flex items-center gap-8 text-[14px] text-[#4b5563]">
            <a href="#how" className="hover:text-foreground">How It Works</a>
            <a href="#how" className="hover:text-foreground">For Suppliers</a>
            <a href="#how" className="hover:text-foreground">For Retailers</a>
          </nav>
          <Link to="/login"><Button className="h-9 px-4">Log in</Button></Link>
        </div>
      </header>

      {/* Hero: full-bleed bg, copy only in left white zone */}
      <section
        className="relative w-full min-h-[420px] md:min-h-[560px] bg-white"
        style={{
          backgroundImage:
            'linear-gradient(90deg, #fff 0%, #fff 42%, transparent 62%), url(/brand/hero-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="mx-auto max-w-[1120px] px-4 py-14 md:py-20">
          <div className="max-w-xl md:max-w-[480px]">
            <h1 className="text-4xl md:text-[44px] font-bold leading-[1.15]">
              Wholesale groceries. Stronger businesses.{' '}
              <span className="text-primary">Better communities.</span>
            </h1>
            <p className="mt-4 text-[15px] text-muted max-w-md leading-relaxed">
              Soukcart is the B2B marketplace that connects grocery suppliers and retailers to buy and sell smarter, together.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/register"><Button className="h-11 px-5">Join as Supplier →</Button></Link>
              <Link to="/register"><Button variant="secondary" className="h-11 px-5 bg-white border-[#c9c9c9] text-[#242526]">Join as Retailer →</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-soft">
        <div className="mx-auto max-w-[1120px] px-4 py-10 grid md:grid-cols-3 gap-6">
          {[
            { Icon: ShieldCheck, t: 'Verified Partners', d: 'Trusted & reliable network' },
            { Icon: Tag, t: 'Competitive Prices', d: 'Better deals, higher margins' },
            { Icon: Truck, t: 'Reliable Delivery', d: 'On-time, every time' },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="flex gap-3 items-start">
              <span className="h-10 w-10 rounded-xl border border-[#f2ccc1] bg-white flex items-center justify-center text-primary">
                <Icon size={18} />
              </span>
              <div>
                <div className="font-semibold">{t}</div>
                <div className="text-sm text-muted">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="bg-soft">
        <div className="mx-auto max-w-[1120px] px-4 py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-[12px] font-semibold tracking-[0.1em] uppercase text-primary">How it works</p>
            <h2 className="text-3xl font-bold mt-2">Built for how grocery businesses trade.</h2>
            <p className="text-muted mt-3 text-[15px]">
              Whether you supply or sell, Soukcart makes the process simple, transparent, and profitable.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4 font-semibold">
                <Grid2x2 size={18} className="text-primary" /> For Suppliers
              </div>
              <div className="space-y-3">
                {supplierSteps.map((title, i) => (
                  <div key={title} className="rounded-xl border border-border bg-white p-4 flex items-center gap-3">
                    <span className="h-8 w-8 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">{i + 1}</span>
                    <div className="font-semibold text-[15px]">{title}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4 font-semibold">
                <ClipboardList size={18} className="text-primary" /> For Retailers
              </div>
              <div className="space-y-3">
                {retailerSteps.map((title, i) => (
                  <div key={title} className="rounded-xl border border-border bg-white p-4 flex items-center gap-3">
                    <span className="h-8 w-8 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">{i + 1}</span>
                    <div className="font-semibold text-[15px]">{title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-soft-2">
        <div className="mx-auto max-w-[1120px] px-4 py-16">
          <div className="max-w-xl">
            <p className="text-[12px] font-semibold tracking-[0.1em] uppercase text-primary">Ready to grow together?</p>
            <h2 className="text-3xl font-bold mt-2">One platform. Endless opportunities.</h2>
            <p className="text-muted mt-3 max-w-md">Join thousands of grocery businesses already growing with Soukcart.</p>
            <Link to="/register" className="inline-block mt-6"><Button className="h-11 px-5">Get Started Today →</Button></Link>
          </div>
        </div>
      </section>

      {/* Bottom cream promo band — phone + box; no text overlay */}
      <section
        className="w-full h-[360px] md:h-[400px] bg-[#F7F2EB]"
        style={{
          backgroundImage: 'url(/brand/banner-bottom.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        aria-label="Soukcart brand"
      />

      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1120px] px-4 py-12 grid md:grid-cols-5 gap-8 text-sm">
          <div className="md:col-span-1">
            <Brand markHeight={24} />
            <p className="text-muted mt-3 text-[13px]">B2B marketplace connecting grocery suppliers and retailers.</p>
            <div className="flex gap-2 mt-4">
              {['f', 'in', 'ig'].map((x) => (
                <span key={x} className="h-8 w-8 rounded-full bg-[#e5e7eb] text-[#6b7280] text-xs font-semibold flex items-center justify-center uppercase">{x}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="font-semibold mb-3">Platform</div>
            <ul className="space-y-2 text-muted">
              {['How It Works', 'For Suppliers', 'For Retailers', 'Benefits', 'Pricing', 'FAQ'].map((x) => <li key={x}>{x}</li>)}
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3">Company</div>
            <ul className="space-y-2 text-muted">
              {['About Us', 'Careers', 'Blog', 'Contact Us'].map((x) => <li key={x}>{x}</li>)}
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3">Legal</div>
            <ul className="space-y-2 text-muted">
              {['Terms of Use', 'Privacy Policy', 'Refund Policy'].map((x) => <li key={x}>{x}</li>)}
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Subscribe to our newsletter</div>
            <p className="text-muted text-[13px] mb-3">Get updates on new features, offers and more.</p>
            <div className="flex gap-2">
              <input placeholder="Enter your email" className="flex-1 h-10 rounded-lg border border-border bg-[#f7f8f8] px-3 text-sm" />
              <Button className="h-10 w-10 p-0" aria-label="Subscribe">→</Button>
            </div>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto max-w-[1120px] px-4 h-14 flex items-center justify-between text-[13px] text-muted">
            <span>{'\u00a9 2026 Soukcart. All rights reserved.'}</span>
            <span>English</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
