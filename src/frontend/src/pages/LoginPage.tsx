import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/global.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)

  const from = location.state?.from?.pathname ?? '/dashboard'

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return
      const amount = 15
      const x = (e.clientX / window.innerWidth - 0.5) * amount
      const y = (e.clientY / window.innerHeight - 0.5) * amount
      cardRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }
    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
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
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--background)',
      fontFamily: 'var(--font-family)'
    }}>
      {/* Camadas atmosféricas */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(var(--primary) 0.5px, transparent 0.5px)',
        backgroundSize: '24px 24px',
        opacity: 0.05,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        top: '-6rem',
        left: '-6rem',
        width: '24rem',
        height: '24rem',
        background: 'var(--primary)',
        opacity: 0.03,
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-6rem',
        right: '-6rem',
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
                width: '6rem',
                height: '6rem',
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
              SGPMC
            </h1>
            <p style={{
              fontSize: 'var(--body-md)',
              color: 'var(--on-surface-variant)',
              maxWidth: '320px',
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              Sistema de Gestão de Protocolos e Monografias Científicos
            </p>
          </div>

          {/* Cartão de login */}
          <div
            ref={cardRef}
            className="card"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--surface-container-high)',
              padding: 'var(--space-4)',
              transition: 'transform 0.1s ease-out',
              willChange: 'transform'
            }}
          >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              
              {/* Erro */}
              {error && (
                <div
                  className="badge badge-error"
                  role="alert"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    padding: 'var(--space-1) var(--space-2)',
                    fontSize: 'var(--body-md)',
                    fontWeight: 'var(--font-medium)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
                  {error}
                </div>
              )}

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label
                  htmlFor="email"
                  style={{
                    fontSize: 'var(--label-md)',
                    fontWeight: 'var(--font-medium)',
                    color: 'var(--on-surface-variant)'
                  }}
                >
                  Email ou Utilizador
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
                    person
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="exemplo@iscisa.ac.mz"
                    required
                    autoComplete="email"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 40px',
                      background: 'var(--surface-container-lowest)',
                      border: '1px solid var(--outline-variant)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--body-md)',
                      fontFamily: 'var(--font-family)',
                      color: 'var(--on-surface)',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
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
                <label
                  htmlFor="password"
                  style={{
                    fontSize: 'var(--label-md)',
                    fontWeight: 'var(--font-medium)',
                    color: 'var(--on-surface-variant)'
                  }}
                >
                  Palavra-passe
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
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      padding: '12px 48px 12px 40px',
                      background: 'var(--surface-container-lowest)',
                      border: '1px solid var(--outline-variant)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--body-md)',
                      fontFamily: 'var(--font-family)',
                      color: 'var(--on-surface)',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
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
                    aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--outline)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--outline)'}
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
                  cursor: 'pointer',
                  fontSize: 'var(--body-md)',
                  color: 'var(--on-surface-variant)',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--on-surface-variant)'}
                >
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      accentColor: 'var(--primary)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer'
                    }}
                  />
                  <span>Lembrar-me</span>
                </label>
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: 'var(--body-md)',
                    color: 'var(--secondary)',
                    textDecoration: 'none',
                    transition: 'text-decoration 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                >
                  Esqueci-me da senha
                </Link>
              </div>

              {/* Botão Entrar */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
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
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--elevation-2)'
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.boxShadow = 'var(--elevation-3)'
                    e.currentTarget.style.transform = 'scale(0.98)'
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
                to="/request-access"
                style={{
                  color: 'var(--primary)',
                  fontWeight: 'var(--font-semibold)',
                  textDecoration: 'none',
                  marginLeft: '4px',
                  transition: 'text-decoration 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
              >
                Solicite acesso
              </Link>
            </div>
          </div>

         
        </div>
      </main>

      {/* Rodapé global */}
      <footer style={{
        width: '100%',
        padding: 'var(--space-1) var(--margin-desktop)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--space-2)',
        borderTop: '1px solid var(--outline-variant)',
        background: 'var(--surface-container-low)',
        marginTop: 'auto',
        fontSize: 'var(--body-md)',
        color: 'var(--on-surface-variant)'
      }}>
        <p>© 2024 ISCISA - Instituto Superior de Ciências de Saúde. Todos os direitos reservados.</p>
        <nav style={{ display: 'flex', gap: 'var(--gutter)' }}>
          <Link to="/terms" style={{ color: 'var(--on-surface-variant)', textDecoration: 'underline', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--on-surface-variant)'}
          >Termos de Uso</Link>
          <Link to="/privacy" style={{ color: 'var(--on-surface-variant)', textDecoration: 'underline', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--on-surface-variant)'}
          >Privacidade</Link>
          <Link to="/contact" style={{ color: 'var(--on-surface-variant)', textDecoration: 'underline', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--on-surface-variant)'}
          >Contacto</Link>
        </nav>
      </footer>

      {/* Animação do spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}