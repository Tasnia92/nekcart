import { useEffect, useState, type FormEvent } from 'react'
import { Button, Card, EmptyState, Input, Label } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import { NotificationsInbox } from '@/components/NotificationsInbox'

export function RetailerTracking() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">Tracking</h2>
      <EmptyState title="Nothing in transit" body="When an order is out for delivery, it will show up here." />
    </div>
  )
}

export function RetailerHelp() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [mine, setMine] = useState<any[]>([])
  const [ok, setOk] = useState('')

  async function load() {
    const d = await api.get<{ complaints: any[] }>('/complaints/mine')
    setMine(d.complaints)
  }
  useEffect(() => { void load() }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    await api.post('/complaints', { subject, message })
    setSubject('')
    setMessage('')
    setOk('Complaint submitted')
    await load()
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <p className="text-xs uppercase text-muted">Support</p>
        <h2 className="text-2xl font-semibold mb-4">Help Center</h2>
        <Card className="p-5">
          <form onSubmit={submit} className="space-y-3">
            <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} required /></div>
            <div><Label>Message</Label><textarea className="w-full min-h-28 rounded-[8px] border border-border bg-[#f7f8f8] p-3 text-sm" value={message} onChange={(e) => setMessage(e.target.value)} required /></div>
            {ok ? <p className="text-sm text-primary">{ok}</p> : null}
            <Button type="submit">Submit complaint</Button>
          </form>
        </Card>
      </div>
      <div>
        <p className="text-xs uppercase text-muted mb-2">Your reports</p>
        <div className="space-y-3">
          {mine.map((c) => (
            <Card key={c._id} className="p-4">
              <div className="font-medium">{c.subject}</div>
              <div className="text-sm text-muted mt-1">{c.status}</div>
              <p className="text-sm mt-2">{c.message}</p>
            </Card>
          ))}
          {!mine.length && <p className="text-muted text-sm">No complaints yet.</p>}
        </div>
      </div>
    </div>
  )
}

export function RetailerNotifications() {
  return <NotificationsInbox heading="Notifications" />
}

export function RetailerSettings() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState<'profile' | 'addresses' | 'password'>('profile')
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Account</h2>
      <div className="inline-flex rounded-xl bg-[#f3f4f6] p-1 mb-4">
        {([
          ['profile', 'Profile'],
          ['addresses', 'Delivery addresses'],
          ['password', 'Password'],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`h-9 px-4 rounded-lg text-sm font-medium ${tab === k ? 'bg-[#242526] text-white' : 'text-muted'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <Card className="p-5 max-w-xl">
        {tab === 'profile' && (
          <div className="space-y-3">
            <div><Label>Name</Label><Input defaultValue={user?.name} readOnly /></div>
            <div><Label>Email</Label><Input defaultValue={user?.email} readOnly /></div>
            <Button variant="danger" onClick={logout}>Log out</Button>
          </div>
        )}
        {tab !== 'profile' && (
          <p className="text-sm text-muted">This tab chrome matches the capture; panel content was not in the screenshot set.</p>
        )}
      </Card>
    </div>
  )
}
