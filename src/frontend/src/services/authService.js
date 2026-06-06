const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function token() {
  return localStorage.getItem('sgpmc_token')
}

async function req(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' }
  if (token()) headers['Authorization'] = `Bearer ${token()}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })

  const data = await res.json()

  if (!res.ok) {
    // Laravel devolve errors como { message } ou { errors: { field: [msgs] } }
    const msg =
      data?.message ??
      Object.values(data?.errors ?? {})?.[0]?.[0] ??
      'Erro desconhecido'
    throw new Error(msg)
  }

  return data
}

export const authService = {
  login:  (email, password) => req('POST', '/api/login',  { email, password }),
  logout: ()                 => req('POST', '/api/logout'),
  me:     ()                 => req('GET',  '/api/me'),

  // Password reset
  forgotPassword: (email)             => req('POST', '/api/password/forgot',   { email }),
  resetPassword:  (token, password, password_confirmation) =>
    req('POST', '/api/password/reset', { token, password, password_confirmation }),
}