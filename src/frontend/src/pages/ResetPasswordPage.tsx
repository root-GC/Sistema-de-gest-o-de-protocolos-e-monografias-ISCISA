// src/pages/ResetPasswordPage.tsx
import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authService } from '../services/authService'
import { LoadingSpinner } from '../components/LoadingSpinner'
import '../styles/global.css'

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
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  // Link inválido
  if (!token || !email) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
        fontFamily: 'var(--font-family)',
        padding: 'var(--space-4)'
      }}>
        <div className="card" style={{
          padding: 'var(--space-4)',
          textAlign: 'center',
          maxWidth: '480px'
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: '48px',
            color: 'var(--error)',
            marginBottom: 'var(--space-2)'
          }}>
            link_off
          </span>
          <h2 style={{
            fontSize: 'var(--title-md)',
            color: 'var(--on-surface)',
            marginBottom: 'var(--space-2)'
          }}>
            Link Inválido
          </h2>
          <p style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--space-3)' }}>
            Este link de recuperação é inválido ou expirou.
          </p>
          <Link
            to="/forgot-password"
            className="btn btn-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>refresh</span>
            Solicitar Novo Link
          </Link>
        </div>
      </div>
    )
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
      {/* Overlay de loading ao submeter */}
      {loading && <LoadingSpinner variant="overlay" text="A actualizar palavra-passe..." />}

      {/* Camadas atmosféricas */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(var(--secondary) 0.5px, transparent 0.5px)',
        backgroundSize: '24px 24px',
        opacity: 0.05,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-6rem',
        left: '-6rem',
        width: '24rem',
        height: '24rem',
        background: 'var(--secondary)',
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
              Nova Palavra-passe
            </h1>
            <p style={{
              fontSize: 'var(--body-md)',
              color: 'var(--on-surface-variant)',
              maxWidth: '320px',
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              Defina uma nova palavra-passe para <strong style={{ color: 'var(--primary)' }}>{email}</strong>
            </p>
          </div>

          {/* Cartão de reset */}
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
              {/* Nova palavra-passe */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label
                  htmlFor="password"
                  style={{
                    fontSize: 'var(--label-md)',
                    fontWeight: 'var(--font-medium)',
                    color: 'var(--on-surface-variant)'
                  }}
                >
                  Nova Palavra-passe
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--outline)',
                      fontSize: '20px',
                      pointerEvents: 'none'
                    }}
                  >
                    lock
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '14px 48px 14px 40px',
                      background: 'var(--surface-container-low)',
                      border: '1px solid var(--outline-variant)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--body-md)',
                      fontFamily: 'var(--font-family)',
                      color: 'var(--on-surface)',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                      opacity: loading ? 0.7 : 1
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'var(--primary)'
                      e.target.style.boxShadow = '0 0 0 2px rgba(0,105,51,0.15)'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'var(--outline-variant)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>

              {/* Confirmar palavra-passe */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label
                  htmlFor="confirmation"
                  style={{
                    fontSize: 'var(--label-md)',
                    fontWeight: 'var(--font-medium)',
                    color: 'var(--on-surface-variant)'
                  }}
                >
                  Confirmar Palavra-passe
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--outline)',
                      fontSize: '20px',
                      pointerEvents: 'none'
                    }}
                  >
                    lock_reset
                  </span>
                  <input
                    id="confirmation"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmation}
                    onChange={e => setConfirmation(e.target.value)}
                    placeholder="Repita a palavra-passe"
                    required
                    minLength={8}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '14px 48px 14px 40px',
                      background: 'var(--surface-container-low)',
                      border: '1px solid var(--outline-variant)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--body-md)',
                      fontFamily: 'var(--font-family)',
                      color: 'var(--on-surface)',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                      opacity: loading ? 0.7 : 1
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'var(--primary)'
                      e.target.style.boxShadow = '0 0 0 2px rgba(0,105,51,0.15)'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'var(--outline-variant)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>

              {/* Mostrar/ocultar senha */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 'var(--body-md)',
                color: 'var(--on-surface-variant)',
                transition: 'color 0.2s',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.color = 'var(--primary)' }}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--on-surface-variant)'}
              >
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={e => setShowPassword(e.target.checked)}
                  disabled={loading}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: 'var(--primary)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                />
                <span>Mostrar palavra-passe</span>
              </label>

              {/* Requisitos da senha */}
              <div style={{
                padding: 'var(--space-2)',
                background: 'var(--surface-container-low)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--label-md)',
                color: 'var(--on-surface-variant)',
                opacity: loading ? 0.7 : 1
              }}>
                <p style={{ fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>
                  A palavra-passe deve conter:
                </p>
                <ul style={{ paddingLeft: '20px', lineHeight: 1.8 }}>
                  <li style={{ color: password.length >= 8 ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
                    Pelo menos 8 caracteres
                  </li>
                  <li style={{ color: /[A-Z]/.test(password) ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
                    Uma letra maiúscula
                  </li>
                  <li style={{ color: /[0-9]/.test(password) ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
                    Um número
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || password !== confirmation || password.length < 8}
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
                  cursor: (loading || password !== confirmation || password.length < 8) ? 'not-allowed' : 'pointer',
                  opacity: (loading || password !== confirmation || password.length < 8) ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--elevation-2)'
                }}
                onMouseEnter={e => {
                  if (!loading && password === confirmation && password.length >= 8) {
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
                    A actualizar...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>save</span>
                    Actualizar Palavra-passe
                  </>
                )}
              </button>
            </form>

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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}