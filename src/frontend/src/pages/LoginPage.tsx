// src/pages/LoginPage.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from '../components/LoadingSpinner'
import '../styles/global.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--background)',
      fontFamily: 'var(--font-family)'
    }}>
      {/* Overlay de loading ao autenticar */}
      {loading && <LoadingSpinner variant="overlay" text="A autenticar..." />}

      {/* Conteúdo principal */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-5) var(--margin-mobile)'
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>

          {/* Cabeçalho institucional */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKW98T0QI3yiR-05Z-BoA6n6AKFK_0ZdAqs1kfapv1inuADxNU7iCp-dKMIMkUti0n9BuBbzOugqpZmuRFq8g0e6hIiwvgFJ3EMlGTBhVTYkjNfkmlUWZEDkXFSNZ59ZVenTCv8hw2KrROVZkKZort3wvb3rQ862iCLbpMPGaiHh1LsvhPKbtxDNFe4jRGObM0eeFiO0gYIZ0z1ac0X6dncZ6JWoUI0NGRm5BtnK_SSPldMEHABk8gTnp6gZnGB41fWkONkURhR3I"
              alt="Logo ISCISA"
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto var(--space-3)',
                objectFit: 'contain'
              }}
            />
            <h1 style={{
              fontSize: 'var(--headline-lg)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--primary)',
              letterSpacing: '-0.02em',
              marginBottom: 'var(--space-1)',
              fontFamily: 'var(--font-family)'
            }}>
              SGPMC
            </h1>
            <p style={{
              fontSize: 'var(--body-md)',
              color: 'var(--on-surface-variant)',
              maxWidth: '340px',
              margin: '0 auto',
              lineHeight: 1.5
            }}>
              Sistema de Gestão de Protocolos e Monografias Científicos
            </p>
          </div>

          {/* Cartão de login */}
          <div className="card" style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--elevation-2)'
          }}>
            <form onSubmit={handleSubmit} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)'
            }}>

              {/* Erro */}
              {error && (
                <div role="alert" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'var(--error-container)',
                  color: 'var(--on-error-container)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--body-md)',
                  fontWeight: 'var(--font-medium)',
                  animation: 'slideUp 0.3s ease'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
                  {error}
                </div>
              )}

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label htmlFor="email" style={{
                  fontSize: 'var(--label-md)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--on-surface-variant)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Email institucional
                </label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--outline)',
                    fontSize: '20px',
                    pointerEvents: 'none'
                  }}>
                    person
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="utilizador@iscisa.ac.mz"
                    required
                    autoComplete="email"
                    autoFocus
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 44px',
                      background: 'var(--surface-container-low)',
                      border: '1px solid var(--outline-variant)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--body-md)',
                      fontFamily: 'var(--font-family)',
                      color: 'var(--on-surface)',
                      outline: 'none',
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

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label htmlFor="password" style={{
                  fontSize: 'var(--label-md)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--on-surface-variant)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Palavra-passe
                </label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--outline)',
                    fontSize: '20px',
                    pointerEvents: 'none'
                  }}>
                    lock
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '14px 48px 14px 44px',
                      background: 'var(--surface-container-low)',
                      border: '1px solid var(--outline-variant)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--body-md)',
                      fontFamily: 'var(--font-family)',
                      color: 'var(--on-surface)',
                      outline: 'none',
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--outline)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: loading ? 0.5 : 1
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Opções */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--body-md)',
                  color: 'var(--on-surface-variant)',
                  opacity: loading ? 0.7 : 1
                }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    disabled={loading}
                    style={{
                      width: '16px',
                      height: '16px',
                      accentColor: 'var(--primary)',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  />
                  Lembrar-me
                </label>
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: 'var(--body-md)',
                    color: 'var(--secondary)',
                    textDecoration: 'none',
                    fontWeight: 'var(--font-medium)',
                    pointerEvents: loading ? 'none' : 'auto',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  Esqueci-me da senha
                </Link>
              </div>

              {/* Botão Entrar */}
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-1)',
                  fontFamily: 'var(--font-family)',
                  fontSize: 'var(--body-lg)',
                  fontWeight: 'var(--font-bold)',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.8 : 1,
                  letterSpacing: '0.02em',
                  marginTop: 'var(--space-1)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.boxShadow = 'var(--elevation-3)'
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'none'
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
                    A entrar...
                  </>
                ) : (
                  <>
                    <span>Entrar</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>login</span>
                  </>
                )}
              </button>
            </form>

            {/* Rodapé do cartão */}
            <div style={{
              marginTop: 'var(--space-4)',
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid var(--outline-variant)',
              textAlign: 'center',
              fontSize: 'var(--body-md)',
              color: 'var(--on-surface-variant)'
            }}>
              Não tem conta?{' '}
              <Link
                to="/register"
                style={{
                  color: 'var(--primary)',
                  fontWeight: 'var(--font-bold)',
                  textDecoration: 'none',
                  pointerEvents: loading ? 'none' : 'auto',
                  opacity: loading ? 0.7 : 1
                }}
              >
                Registe-se
              </Link>
            </div>
          </div>

        </div>
      </main>

      {/* Rodapé global */}
      <footer style={{
        width: '100%',
        padding: 'var(--space-2) var(--gutter)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--space-2)',
        borderTop: '1px solid var(--outline-variant)',
        background: 'var(--surface-container-lowest)',
        fontSize: 'var(--label-md)',
        color: 'var(--on-surface-variant)'
      }}>
        <p>© 2026 ISCISA — Instituto Superior de Ciências de Saúde</p>
        <nav style={{ display: 'flex', gap: 'var(--gutter)' }}>
          <Link to="/terms" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: 'var(--label-md)' }}>
            Termos de Uso
          </Link>
          <Link to="/privacy" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: 'var(--label-md)' }}>
            Privacidade
          </Link>
          <Link to="/contact" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: 'var(--label-md)' }}>
            Contacto
          </Link>
        </nav>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}