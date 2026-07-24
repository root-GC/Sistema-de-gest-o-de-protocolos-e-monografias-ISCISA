// src/pages/VerifyOtpPage.tsx
import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from '../components/LoadingSpinner'
import '../styles/global.css'

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { completeAuth } = useAuth()

  const email = (location.state as { email?: string } | null)?.email

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!email) navigate('/register', { replace: true })
    else inputRef.current?.focus()
  }, [email, navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email || code.length !== 6) return
    setError(null)
    setLoading(true)
    try {
      const res = await authService.verifyOtp(email, code)
      await completeAuth(res.token, res.user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setCode('')
      inputRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!email || cooldown > 0) return
    setResending(true)
    setError(null)
    try {
      await authService.resendOtp(email)
      setCooldown(60)
      setCode('')
      inputRef.current?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setResending(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--background)',
      fontFamily: 'var(--font-family)'
    }}>
      {/* Overlay de loading ao verificar */}
      {loading && <LoadingSpinner variant="overlay" text="A verificar código..." />}

      {/* Camadas atmosféricas */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(var(--tertiary) 0.5px, transparent 0.5px)',
        backgroundSize: '24px 24px',
        opacity: 0.05,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        top: '-6rem',
        right: '-6rem',
        width: '24rem',
        height: '24rem',
        background: 'var(--tertiary)',
        opacity: 0.03,
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }} />

      {/* Conteúdo principal */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-5) var(--margin-mobile)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          
          {/* Cabeçalho institucional */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKW98T0QI3yiR-05Z-BoA6n6AKFK_0ZdAqs1kfapv1inuADxNU7iCp-dKMIMkUti0n9BuBbzOugqpZmuRFq8g0e6hIiwvgFJ3EMlGTBhVTYkjNfkmlUWZEDkXFSNZ59ZVenTCv8hw2KrROVZkKZort3wvb3rQ862iCLbpMPGaiHh1LsvhPKbtxDNFe4jRGObM0eeFiO0gYIZ0z1ac0X6dncZ6JWoUI0NGRm5BtnK_SSPldMEHABk8gTnp6gZnGB41fWkONkURhR3I"
              alt="Logo ISCISA"
              style={{
                width: '5rem',
                height: '5rem',
                margin: '0 auto var(--space-3)',
                objectFit: 'contain',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
              }}
            />
            <h1 style={{
              fontSize: 'var(--headline-lg)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--primary)',
              letterSpacing: '-0.02em',
              marginBottom: 'var(--space-1)',
              fontFamily: 'var(--font-family)'
            }}>
              Verificação de Email
            </h1>
            <p style={{
              fontSize: 'var(--body-md)',
              color: 'var(--on-surface-variant)',
              maxWidth: '320px',
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              Enviámos um código de 6 dígitos para{' '}
              <strong style={{ color: 'var(--primary)' }}>{email}</strong>
            </p>
          </div>

          {/* Cartão de verificação */}
          <div
            className="card"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--surface-container-high)',
              padding: 'var(--space-4)',
            }}
          >
            {error && (
              <div
                className="badge badge-error"
                role="alert"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  padding: 'var(--space-2) var(--space-3)',
                  marginBottom: 'var(--space-3)',
                  fontSize: 'var(--body-md)',
                  fontWeight: 'var(--font-medium)',
                  animation: 'slideUp 0.3s ease'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {/* Ícone de email */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--tertiary-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-2)',
              }}>
                <span className="material-symbols-outlined" style={{
                  fontSize: '32px',
                  color: 'var(--tertiary)'
                }}>
                  mark_email_unread
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label
                  htmlFor="otp"
                  style={{
                    fontSize: 'var(--label-md)',
                    fontWeight: 'var(--font-medium)',
                    color: 'var(--on-surface-variant)',
                    textAlign: 'center'
                  }}
                >
                  Código de Verificação
                </label>
                <input
                  ref={inputRef}
                  id="otp"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '28px',
                    letterSpacing: '12px',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontWeight: 'var(--font-bold)',
                    border: '2px solid var(--outline-variant)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--surface-container-lowest)',
                    color: 'var(--on-surface)',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                    opacity: loading ? 0.7 : 1
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'var(--primary)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,105,51,0.15)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'var(--outline-variant)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Indicador de dígitos */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px'
              }}>
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: i < code.length ? 'var(--primary)' : 'var(--surface-container-high)',
                      transition: 'all 0.2s ease',
                      opacity: loading ? 0.7 : 1
                    }}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || code.length !== 6}
                style={{
                  width: '100%',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-1)',
                  fontFamily: 'var(--font-family)',
                  fontSize: 'var(--title-md)',
                  fontWeight: 'var(--font-semibold)',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  cursor: (loading || code.length !== 6) ? 'not-allowed' : 'pointer',
                  opacity: (loading || code.length !== 6) ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--elevation-2)'
                }}
                onMouseEnter={e => {
                  if (!loading && code.length === 6) {
                    e.currentTarget.style.boxShadow = 'var(--elevation-3)'
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'var(--elevation-2)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid var(--on-primary)',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    A verificar...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>verified</span>
                    Confirmar Código
                  </>
                )}
              </button>
            </form>

            {/* Reenviar código */}
            <div style={{
              marginTop: 'var(--space-3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}>
              <p style={{
                fontSize: 'var(--body-md)',
                color: 'var(--on-surface-variant)',
                textAlign: 'center'
              }}>
                Não recebeu o código?
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || cooldown > 0 || loading}
                className="btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  opacity: (resending || cooldown > 0 || loading) ? 0.5 : 1,
                  cursor: (resending || cooldown > 0 || loading) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {resending ? (
                  <>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid var(--on-surface)',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    A enviar...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {cooldown > 0 ? 'schedule' : 'refresh'}
                    </span>
                    {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar Código'}
                  </>
                )}
              </button>
            </div>

            <div style={{
              marginTop: 'var(--space-4)',
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid var(--outline-variant)',
              textAlign: 'center',
              fontSize: 'var(--body-md)',
              color: 'var(--on-surface-variant)',
              opacity: loading ? 0.7 : 1
            }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--primary)',
                  fontWeight: 'var(--font-semibold)',
                  textDecoration: 'none',
                  transition: 'text-decoration 0.2s',
                  pointerEvents: loading ? 'none' : 'auto'
                }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                Voltar ao Login
              </Link>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}