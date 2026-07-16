import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../services/authService'
import '../styles/global.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
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
        right: '-6rem',
        width: '24rem',
        height: '24rem',
        background: 'var(--primary)',
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
              Recuperar Palavra-passe
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

          {/* Cartão de recuperação */}
          <div
            className="card"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--surface-container-high)',
              padding: 'var(--space-4)',
            }}
          >
            {sent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--primary-container)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-3)',
                }}>
                  <span className="material-symbols-outlined" style={{
                    fontSize: '32px',
                    color: 'var(--primary)'
                  }}>
                    mark_email_read
                  </span>
                </div>
                <h2 style={{
                  fontSize: 'var(--title-md)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--on-surface)',
                  marginBottom: 'var(--space-2)'
                }}>
                  Email Enviado!
                </h2>
                <p style={{
                  color: 'var(--on-surface-variant)',
                  lineHeight: 1.6,
                  marginBottom: 'var(--space-3)'
                }}>
                  Se o email <strong style={{ color: 'var(--primary)' }}>{email}</strong> existir na nossa base de dados, 
                  receberá um link de recuperação em breve.
                </p>
                <Link
                  to="/login"
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    textDecoration: 'none',
                    padding: '12px 24px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
                  Voltar ao Login
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div
                    className="badge badge-error"
                    role="alert"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      padding: 'var(--space-1) var(--space-2)',
                      marginBottom: 'var(--space-3)',
                      fontSize: 'var(--body-md)',
                      fontWeight: 'var(--font-medium)'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label
                      htmlFor="email"
                      style={{
                        fontSize: 'var(--label-md)',
                        fontWeight: 'var(--font-medium)',
                        color: 'var(--on-surface-variant)'
                      }}
                    >
                      Email Institucional
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
                        mail
                      </span>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="exemplo@iscisa.ac.mz"
                        required
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
                        A enviar...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
                        Enviar Link de Recuperação
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            <div style={{
              marginTop: 'var(--space-4)',
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid var(--outline-variant)',
              textAlign: 'center',
              fontSize: 'var(--body-md)',
              color: 'var(--on-surface-variant)'
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
                  transition: 'text-decoration 0.2s'
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

      {/* Animação do spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}