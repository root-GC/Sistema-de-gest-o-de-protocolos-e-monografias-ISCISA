import type { UserPayload } from '../context/AuthContext'

const BASE = import.meta.env.VITE_API_URL ?? ''

function token(): string | null {
  return localStorage.getItem('sgpmc_token')
}

interface LoginResponse {
  message: string
  token: string
  user: UserPayload
}

interface MeResponse {
  user: UserPayload
}

interface MessageResponse {
  message: string
}

interface RegisterPayload {
  type: 'student' | 'teacher'
  name: string
  email: string
  password: string
  password_confirmation: string
  course_id?: number
  supervisor_id?: number
  student_number?: string
  scientific_area_id?: number
  academic_degree?: 'licenciatura' | 'mestrado' | 'doutoramento'
  department?: string
}

interface RegisterResponse {
  message: string
  email: string
}

async function req<T>(method: string, path: string, body: unknown = null): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  const t = token()
  if (t) headers['Authorization'] = `Bearer ${t}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })

  const data = await res.json()

  if (!res.ok) {
    const msg =
      data?.message ??
      (Object.values(data?.errors ?? {})[0] as string[] | undefined)?.[0] ??
      'Erro desconhecido'
    throw new Error(msg)
  }

  return data as T
}

export const authService = {
  login: (email: string, password: string) =>
    req<LoginResponse>('POST', '/api/login', { email, password }),

  logout: () => req<MessageResponse>('POST', '/api/logout'),

  me: () => req<MeResponse>('GET', '/api/me'),

  register: (payload: RegisterPayload) =>
    req<RegisterResponse>('POST', '/api/register', payload),

  verifyOtp: (email: string, code: string) =>
    req<LoginResponse>('POST', '/api/verify-otp', { email, code }),

  resendOtp: (email: string) =>
    req<MessageResponse>('POST', '/api/resend-otp', { email }),

  forgotPassword: (email: string) =>
    req<MessageResponse>('POST', '/api/password/forgot', { email }),

  resetPassword: (
    email: string,
    token: string,
    password: string,
    password_confirmation: string
  ) =>
    req<MessageResponse>('POST', '/api/password/reset', {
      email,
      token,
      password,
      password_confirmation,
    }),
}
