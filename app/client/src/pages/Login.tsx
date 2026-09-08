import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { AuthShell, RoleTabs } from '@/components/AuthShell'
import { Button, Input, Label } from '@/components/ui'
import { useAuth, type Role } from '@/context/AuthContext'

function homeFor(role: Role) {
  if (role === 'admin') return '/admin'
  if (role === 'supplier') return '/supplier'
  return '/retailer/products'
}

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const adminMode = params.get('as') === 'admin'
  const [role, setRole] = useState<'retailer' | 'supplier'>('retailer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [keep, setKeep] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login(email, password)
      if (!adminMode && user.role !== 'admin' && user.role !== role) {
        setError(`This account is a ${user.role}. Switch the tab or use the matching account.`)
        setLoading(false)
        return
      }
      navigate(homeFor(user.role))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const subtitle = adminMode
    ? 'Sign in with your admin credentials to moderate the marketplace.'
    : role === 'retailer'
      ? 'Sign in to your retailer workspace and manage every order from one clear view.'
      : 'Sign in to your supplier workspace to manage catalog, stock, and orders.'

  return (
    <AuthShell>
      {!adminMode && <RoleTabs role={role} onChange={setRole} />}
      <div className={adminMode ? '' : 'mt-6'}>
        <p className="text-[12px] font-semibold text-primary">Welcome</p>
        <h1 className="text-[28px] font-bold leading-tight mt-1">
          {adminMode ? 'Admin sign in' : 'Your business, in sync.'}
        </h1>
        <p className="text-sm text-muted mt-2">{subtitle}</p>
      </div>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <Label>Email Address</Label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input className="pl-10" placeholder="Enter your email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Password</Label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input className="pl-10 pr-10" placeholder="Enter your password" type={show ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" onClick={() => setShow((s) => !s)} aria-label="Toggle password">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2 text-muted">
            <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} className="rounded border-border" />
            Keep me signed in
          </label>
          <button type="button" className="text-primary font-medium">Forgot password?</button>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button className="w-full h-11" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      {!adminMode && (
        <p className="text-sm text-center mt-4 text-muted">
          New to SoukCart? <Link className="text-primary font-semibold" to="/register">Create an account</Link>
        </p>
      )}
      <div className="mt-5 pt-4 border-t border-border text-center text-xs text-muted">
        By continuing, you agree to SoukCart&apos;s <span className="text-primary font-medium">Terms & Privacy</span>.
      </div>
    </AuthShell>
  )
}
