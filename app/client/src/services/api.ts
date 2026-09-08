const API = '/api'

function headers(): HeadersInit {
  const token = localStorage.getItem('nekcart_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { ...headers(), ...(options.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { message?: string }).message || 'Request failed')
  return data as T
}

export const api = {
  get: <T,>(path: string) => req<T>(path),
  post: <T,>(path: string, body?: unknown) =>
    req<T>(path, { method: 'POST', body: JSON.stringify(body || {}) }),
  patch: <T,>(path: string, body?: unknown) =>
    req<T>(path, { method: 'PATCH', body: JSON.stringify(body || {}) }),
  delete: <T,>(path: string) => req<T>(path, { method: 'DELETE' }),
}
