// src/services/authService.ts
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

interface ValidateResetTokenResponse {
  valid: boolean
  seconds_remaining: number
}

interface OtpStatusResponse {
  seconds_remaining: number | null
  resend_cooldown: number
}

// Erro customizado para cooldown de reenvio
export class ResendCooldownError extends Error {
  retryAfter: number

  constructor(message: string, retryAfter: number) {
    super(message)
    this.name = 'ResendCooldownError'
    this.retryAfter = retryAfter
  }
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

  const data = await res.json().catch(() => ({})) as any

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

  // Resend OTP com tratamento de cooldown
  resendOtp: async (email: string): Promise<MessageResponse> => {
    const res = await fetch(`${BASE}/api/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json().catch(() => ({})) as any

    if (res.status === 429) {
      throw new ResendCooldownError(
        data.message ?? 'Aguarde antes de reenviar.',
        data.retry_after ?? 60
      )
    }
    if (!res.ok) {
      throw new Error(data?.message ?? 'Erro desconhecido')
    }
    return data
  },

  forgotPassword: (email: string) =>
    req<MessageResponse>('POST', '/api/password/forgot', { email }),

  validateResetToken: async (email: string, token: string): Promise<ValidateResetTokenResponse> => {
    const url = `${BASE}/api/reset-password/validate?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
    
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({})) as any
        throw new Error(errorData.message || 'Link inválido ou expirado')
      }
      
      return res.json()
    } catch (error) {
      throw error
    }
  },

  resetPassword: (email: string, token: string, password: string, password_confirmation: string) =>
    req<MessageResponse>('POST', '/api/password/reset', { email, token, password, password_confirmation }),

  // Status do OTP
  otpStatus: async (email: string, purpose = 'register'): Promise<OtpStatusResponse> => {
    const res = await fetch(`${BASE}/api/otp/status?email=${encodeURIComponent(email)}&purpose=${purpose}`)
    if (!res.ok) throw new Error('Não foi possível verificar o estado do código.')
    return res.json()
  },
}