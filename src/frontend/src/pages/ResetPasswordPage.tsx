// src/pages/ResetPasswordPage.tsx
import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authService } from '../services/authService'
import { LoadingSpinner } from '../components/LoadingSpinner'
import '../styles/global.css'

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [initialSeconds, setInitialSeconds] = useState<number>(600)
  const [checkingToken, setCheckingToken] = useState(true)
  const [tokenExpired, setTokenExpired] = useState(false)

  useEffect(() => {
    if (!token || !email) {
      setCheckingToken(false)
      return
    }
    authService.validateResetToken(email, token)
      .then(res => {
        if (!res.valid) {
          setTokenExpired(true)
        } else {
          setSecondsLeft(res.seconds_remaining)
          setInitialSeconds(res.seconds_remaining)
        }
      })
      .catch(() => setTokenExpired(true))
      .finally(() => setCheckingToken(false))
  }, [token, email])

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return
    const t = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev === null) return null
        if (prev <= 1) {
          setTokenExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [secondsLeft !== null])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (password !== confirmation) {
      setError('As palavras-passe não coincidem.')
      return
    }
    if (password.length < 8) {
      setError('A palavra-passe deve ter pelo menos 8 caracteres.')
      return
    }
    setLoading(true)
    try {
      await authService.resetPassword(email, token, password, confirmation)
      navigate('/login', { replace: true, state: { resetSuccess: true } })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.toLowerCase().includes('expir')) setTokenExpired(true)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (checkingToken) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <LoadingSpinner variant="inline" text="A validar link..." />
      </div>
    )
  }

  if (!token || !email || tokenExpired) {
    return (
      <div className="reset-page">
        <div className="reset-card reset-card--error">
          <span className="material-symbols-outlined reset-icon--error">{tokenExpired ? 'timer_off' : 'link_off'}</span>
          <h2>{tokenExpired ? 'Link Expirado' : 'Link Inválido'}</h2>
          <p>{tokenExpired ? 'O prazo expirou. Solicite um novo link.' : 'Link inválido ou já utilizado.'}</p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined">refresh</span>
            Solicitar Novo Link
          </Link>
        </div>
      </div>
    )
  }

  const progressPercent = initialSeconds > 0 ? (secondsLeft! / initialSeconds) * 100 : 0
  const isUrgent = secondsLeft !== null && secondsLeft < 60

  return (
    <div className="reset-page">
      {loading && <LoadingSpinner variant="overlay" text="A actualizar palavra-passe..." />}

      <main className="reset-main">
        <div className="reset-container">
          
          {/* Header */}
          <div className="reset-header">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKW98T0QI3yiR-05Z-BoA6n6AKFK_0ZdAqs1kfapv1inuADxNU7iCp-dKMIMkUti0n9BuBbzOugqpZmuRFq8g0e6hIiwvgFJ3EMlGTBhVTYkjNfkmlUWZEDkXFSNZ59ZVenTCv8hw2KrROVZkKZort3wvb3rQ862iCLbpMPGaiHh1LsvhPKbtxDNFe4jRGObM0eeFiO0gYIZ0z1ac0X6dncZ6JWoUI0NGRm5BtnK_SSPldMEHABk8gTnp6gZnGB41fWkONkURhR3I" alt="ISCISA" className="reset-logo" />
            <h1>Nova Palavra-passe</h1>
            <p>Defina uma nova palavra-passe para <strong>{email}</strong></p>
          </div>

          {/* Card */}
          <div className="card reset-form-card">
            
            {/* Timer */}
            {secondsLeft !== null && (
              <div className={`reset-timer ${isUrgent ? 'reset-timer--urgent' : ''}`}>
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="27" fill="none" stroke="var(--surface-container-high)" strokeWidth="3" />
                  <circle cx="30" cy="30" r="27" fill="none" 
                    stroke={isUrgent ? 'var(--error)' : 'var(--primary)'} 
                    strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 27}`}
                    strokeDashoffset={`${2 * Math.PI * 27 * (1 - progressPercent / 100)}`}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <span className={`material-symbols-outlined reset-timer-icon ${isUrgent ? 'reset-timer-icon--shake' : ''}`}>
                  {isUrgent ? 'timer_off' : 'schedule'}
                </span>
                <div className="reset-timer-text">
                  <span className={`reset-timer-time ${isUrgent ? 'reset-timer-time--urgent' : ''}`}>
                    {formatTime(secondsLeft)}
                  </span>
                  <span className="reset-timer-label">
                    {isUrgent ? 'Expira em breve!' : 'Tempo restante'}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="badge badge-error" role="alert" style={{ display: 'flex', gap: '8px', marginBottom: '16px', padding: '12px' }}>
                <span className="material-symbols-outlined">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="reset-form">
              <div className="reset-field">
                <label htmlFor="password">Nova Palavra-passe</label>
                <div className="reset-input-wrapper">
                  <span className="material-symbols-outlined reset-input-icon">lock</span>
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres"
                    required minLength={8} disabled={loading || tokenExpired} />
                </div>
              </div>

              <div className="reset-field">
                <label htmlFor="confirmation">Confirmar Palavra-passe</label>
                <div className="reset-input-wrapper">
                  <span className="material-symbols-outlined reset-input-icon">
                    {confirmation && password === confirmation ? 'check_circle' : 'lock_reset'}
                  </span>
                  <input id="confirmation" type={showPassword ? 'text' : 'password'} value={confirmation}
                    onChange={e => setConfirmation(e.target.value)} placeholder="Repita a palavra-passe"
                    required minLength={8} disabled={loading || tokenExpired}
                    className={confirmation ? (password === confirmation ? 'input-match' : 'input-mismatch') : ''} />
                </div>
              </div>

              <label className="reset-show-password">
                <input type="checkbox" checked={showPassword} onChange={e => setShowPassword(e.target.checked)}
                  disabled={loading || tokenExpired} />
                Mostrar palavra-passe
              </label>

              <div className="reset-requirements">
                <p>Requisitos:</p>
                <ul>
                  <li className={password.length >= 8 ? 'req-met' : ''}>
                    <span className="material-symbols-outlined">{password.length >= 8 ? 'check_circle' : 'radio_button_unchecked'}</span>
                    8+ caracteres
                  </li>
                  <li className={/[A-Z]/.test(password) ? 'req-met' : ''}>
                    <span className="material-symbols-outlined">{/[A-Z]/.test(password) ? 'check_circle' : 'radio_button_unchecked'}</span>
                    Letra maiúscula
                  </li>
                  <li className={/[0-9]/.test(password) ? 'req-met' : ''}>
                    <span className="material-symbols-outlined">{/[0-9]/.test(password) ? 'check_circle' : 'radio_button_unchecked'}</span>
                    Número
                  </li>
                </ul>
              </div>

              <button type="submit" className="btn btn-primary btn-lg"
                disabled={loading || tokenExpired || password !== confirmation || password.length < 8}>
                {loading ? 'A actualizar...' : 'Actualizar Palavra-passe'}
              </button>
            </form>

            <div className="reset-back-link">
              <Link to="/login">
                <span className="material-symbols-outlined">arrow_back</span>
                Voltar ao Login
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}