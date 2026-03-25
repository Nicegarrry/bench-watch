function authHeaders(): Record<string, string> {
  const raw = localStorage.getItem('wasp:sessionId')
  const sessionId = raw ? JSON.parse(raw) : null
  return sessionId ? { Authorization: `Bearer ${sessionId}` } : {}
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  })
}
