// src/pages/LoginPage2.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LoadingSpinner } from '../components/LoadingSpinner'
import '../styles/global.css'

export default function LoginPage2() {
  const navigate = useNavigate()

  // Estados do login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Controlo do fluxo: 'login' -> 'register' (quando login bem sucedido)
  const [flowStep, setFlowStep] = useState<'login' | 'register'>('login')

  // Estados do registo de docente
  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    specialization: '',
    academicDegree: '',
    professionalNumber: '',
    password: '',
    confirmPassword: ''
  })
  const [regError, setRegError] = useState<string | null>(null)
  const [regSuccess, setRegSuccess] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  // Departamentos disponíveis
  const departments = [
    'Ciências Biomédicas',
    'Ciências de Enfermagem',
    'Ciências Farmacêuticas',
    'Ciências de Nutrição',
    'Ciências de Saúde Pública',
    'Ciências Dentárias',
    'Ciências de Fisioterapia',
    'Ciências de Radiologia'
  ]

  // Graus académicos
  const academicDegrees = [
    'Licenciatura',
    'Mestrado',
    'Doutoramento',
    'Pós-Doutoramento',
    'Especialização'
  ]

  // 🧪 DEMO: Aceita qualquer email e senha
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Simular delay de autenticação (apenas para efeito visual)
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Aceitar qualquer credencial para demonstração
    // Apenas validação básica de campos preenchidos
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.')
      setLoading(false)
      return
    }

    // Simular sucesso e avançar para o registo
    setLoading(false)
    setFlowStep('register')
  }

  // 🧪 DEMO: Simular submissão do registo
  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setRegError(null)

    // Validações
    if (regForm.password !== regForm.confirmPassword) {
      setRegError('As palavras-passe não coincidem')
      return
    }

    if (regForm.password.length < 8) {
      setRegError('A palavra-passe deve ter pelo menos 8 caracteres')
      return
    }

    if (!acceptedTerms) {
      setRegError('Deve aceitar os termos e condições')
      return
    }

    if (!regForm.professionalNumber) {
      setRegError('O número da carteira profissional é obrigatório')
      return
    }

    setRegLoading(true)

    try {
      // Simular chamada à API
      console.log('📋 Dados de registo do docente:', regForm)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setRegSuccess(true)

      // Após 3 segundos, redirecionar para dashboard (simulação)
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 3000)

    } catch (err) {
      setRegError('Erro ao processar o registo. Tente novamente.')
    } finally {
      setRegLoading(false)
    }
  }

  function handleRegInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setRegForm(prev => ({ ...prev, [name]: value }))
  }

  // Voltar ao login (apenas para debug/demo)
  function handleBackToLogin() {
    setFlowStep('login')
    setRegError(null)
    setRegSuccess(false)
    setRegForm({
      fullName: '',
      email: '',
      phone: '',
      department: '',
      specialization: '',
      academicDegree: '',
      professionalNumber: '',
      password: '',
      confirmPassword: ''
    })
    setAcceptedTerms(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--background)',
      fontFamily: 'var(--font-family)'
    }}>
      {/* Overlay de loading */}
      {(loading || regLoading) && (
        <LoadingSpinner 
          variant="overlay" 
          text={loading ? '🔄 A verificar credenciais...' : '📝 A processar registo...'} 
        />
      )}

      {/* Conteúdo principal */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-5) var(--margin-mobile)'
      }}>
        <div style={{ width: '100%', maxWidth: flowStep === 'register' ? '600px' : '440px' }}>

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
            
            {/* Badge de demonstração */}
            <div style={{
              display: 'inline-block',
              marginTop: 'var(--space-2)',
              padding: '4px 12px',
              background: 'var(--tertiary-container)',
              color: 'var(--on-tertiary-container)',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--label-sm)',
              fontWeight: 'var(--font-semibold)'
            }}>
              🧪 MODO DEMONSTRAÇÃO
            </div>
          </div>

          {/* PASSO 1: Login */}
          {flowStep === 'login' && (
            <div className="card" style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--elevation-2)',
              animation: 'slideUp 0.3s ease'
            }}>
              <div style={{
                marginBottom: 'var(--space-3)',
                textAlign: 'center'
              }}>
                <h2 style={{
                  fontSize: 'var(--headline-sm)',
                  fontWeight: 'var(--font-bold)',
                  color: 'var(--on-surface)',
                  marginBottom: 'var(--space-1)'
                }}>
                  Bem-vindo de volta
                </h2>
                <p style={{
                  fontSize: 'var(--body-sm)',
                  color: 'var(--on-surface-variant)'
                }}>
                  Faça login para aceder ao sistema
                </p>
              </div>

              <form onSubmit={handleLogin} style={{
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
                    fontWeight: 'var(--font-medium)'
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
                    Email
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
                      placeholder="qualquer@email.com"
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
                      placeholder="Qualquer senha funciona"
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

                {/* Aviso demo */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2)',
                  background: 'var(--tertiary-container)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--body-sm)',
                  color: 'var(--on-tertiary-container)'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
                  <span>Demo: Qualquer email e senha serão aceites</span>
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
                    transition: 'all 0.2s ease',
                    background: 'var(--primary)',
                    color: 'var(--on-primary)'
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
                      A verificar...
                    </>
                  ) : (
                    <>
                      <span>Entrar</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>login</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* PASSO 2: Registo do Docente */}
          {flowStep === 'register' && (
            <div className="card" style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--elevation-2)',
              animation: 'slideUp 0.3s ease'
            }}>
              {/* Mensagem de sucesso */}
              {regSuccess && (
                <div role="alert" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3)',
                  background: 'var(--success-container)',
                  color: 'var(--on-success-container)',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: 'var(--space-3)',
                  fontSize: 'var(--body-md)',
                  fontWeight: 'var(--font-medium)',
                  animation: 'slideUp 0.3s ease'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>check_circle</span>
                  <div>
                    <strong>✅ Registo concluído com sucesso!</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: 'var(--body-sm)' }}>
                      A redirecionar para o dashboard...
                    </p>
                  </div>
                </div>
              )}

              {/* Cabeçalho do registo */}
              <div style={{
                marginBottom: 'var(--space-3)',
                paddingBottom: 'var(--space-2)',
                borderBottom: '1px solid var(--outline-variant)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h2 style={{
                    fontSize: 'var(--headline-sm)',
                    fontWeight: 'var(--font-bold)',
                    color: 'var(--on-surface)',
                    marginBottom: 'var(--space-1)'
                  }}>
                    📋 Complete o seu perfil
                  </h2>
                  <p style={{
                    fontSize: 'var(--body-sm)',
                    color: 'var(--on-surface-variant)'
                  }}>
                    Registe-se como docente/orientador no SGPMC
                  </p>
                </div>
                
                {/* Indicador de passo */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontSize: 'var(--label-sm)',
                  color: 'var(--on-surface-variant)'
                }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'var(--on-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'var(--font-bold)',
                    fontSize: 'var(--label-sm)'
                  }}>
                    ✓
                  </span>
                  <span style={{ opacity: 0.5 }}>→</span>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'var(--on-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'var(--font-bold)',
                    fontSize: 'var(--label-sm)'
                  }}>
                    2
                  </span>
                  <span style={{ fontSize: 'var(--label-sm)', opacity: 0.7 }}>Passo 2/2</span>
                </div>
              </div>

              <form onSubmit={handleRegister} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)'
              }}>
                {/* Erro de registo */}
                {regError && (
                  <div role="alert" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--error-container)',
                    color: 'var(--on-error-container)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--body-md)',
                    fontWeight: 'var(--font-medium)'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
                    {regError}
                  </div>
                )}

                {/* Nome Completo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label htmlFor="fullName" style={{
                    fontSize: 'var(--label-md)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--on-surface-variant)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Nome Completo *
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={regForm.fullName}
                    onChange={handleRegInputChange}
                    placeholder="Ex: Dr. João Silva"
                    required
                    disabled={regLoading || regSuccess}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--surface-container-low)',
                      border: '1px solid var(--outline-variant)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--body-md)',
                      fontFamily: 'var(--font-family)',
                      color: 'var(--on-surface)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Email e Telefone - Grid 2 colunas */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-2)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label htmlFor="regEmail" style={{
                      fontSize: 'var(--label-md)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--on-surface-variant)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Email *
                    </label>
                    <input
                      id="regEmail"
                      name="email"
                      type="email"
                      value={regForm.email}
                      onChange={handleRegInputChange}
                      placeholder="email@exemplo.com"
                      required
                      disabled={regLoading || regSuccess}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'var(--surface-container-low)',
                        border: '1px solid var(--outline-variant)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: 'var(--body-md)',
                        fontFamily: 'var(--font-family)',
                        color: 'var(--on-surface)',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label htmlFor="phone" style={{
                      fontSize: 'var(--label-md)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--on-surface-variant)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Telefone *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={regForm.phone}
                      onChange={handleRegInputChange}
                      placeholder="+258 84 123 4567"
                      required
                      disabled={regLoading || regSuccess}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'var(--surface-container-low)',
                        border: '1px solid var(--outline-variant)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: 'var(--body-md)',
                        fontFamily: 'var(--font-family)',
                        color: 'var(--on-surface)',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Departamento e Grau Académico - Grid 2 colunas */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-2)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label htmlFor="department" style={{
                      fontSize: 'var(--label-md)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--on-surface-variant)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Departamento *
                    </label>
                    <select
                      id="department"
                      name="department"
                      value={regForm.department}
                      onChange={handleRegInputChange}
                      required
                      disabled={regLoading || regSuccess}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'var(--surface-container-low)',
                        border: '1px solid var(--outline-variant)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: 'var(--body-md)',
                        fontFamily: 'var(--font-family)',
                        color: 'var(--on-surface)',
                        outline: 'none',
                        boxSizing: 'border-box',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Selecionar departamento</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label htmlFor="academicDegree" style={{
                      fontSize: 'var(--label-md)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--on-surface-variant)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Grau Académico *
                    </label>
                    <select
                      id="academicDegree"
                      name="academicDegree"
                      value={regForm.academicDegree}
                      onChange={handleRegInputChange}
                      required
                      disabled={regLoading || regSuccess}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'var(--surface-container-low)',
                        border: '1px solid var(--outline-variant)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: 'var(--body-md)',
                        fontFamily: 'var(--font-family)',
                        color: 'var(--on-surface)',
                        outline: 'none',
                        boxSizing: 'border-box',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Selecionar grau</option>
                      {academicDegrees.map(degree => (
                        <option key={degree} value={degree}>{degree}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Especialização e Nº Carteira Profissional - Grid 2 colunas */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-2)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label htmlFor="specialization" style={{
                      fontSize: 'var(--label-md)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--on-surface-variant)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Especialização *
                    </label>
                    <input
                      id="specialization"
                      name="specialization"
                      type="text"
                      value={regForm.specialization}
                      onChange={handleRegInputChange}
                      placeholder="Ex: Cardiologia"
                      required
                      disabled={regLoading || regSuccess}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'var(--surface-container-low)',
                        border: '1px solid var(--outline-variant)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: 'var(--body-md)',
                        fontFamily: 'var(--font-family)',
                        color: 'var(--on-surface)',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label htmlFor="professionalNumber" style={{
                      fontSize: 'var(--label-md)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--on-surface-variant)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Nº Carteira Profissional *
                    </label>
                    <input
                      id="professionalNumber"
                      name="professionalNumber"
                      type="text"
                      value={regForm.professionalNumber}
                      onChange={handleRegInputChange}
                      placeholder="Ex: CP-12345"
                      required
                      disabled={regLoading || regSuccess}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'var(--surface-container-low)',
                        border: '1px solid var(--outline-variant)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: 'var(--body-md)',
                        fontFamily: 'var(--font-family)',
                        color: 'var(--on-surface)',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Password e Confirmar Password - Grid 2 colunas */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-2)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label htmlFor="regPassword" style={{
                      fontSize: 'var(--label-md)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--on-surface-variant)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Palavra-passe *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="regPassword"
                        name="password"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regForm.password}
                        onChange={handleRegInputChange}
                        placeholder="Mínimo 8 caracteres"
                        required
                        minLength={8}
                        disabled={regLoading || regSuccess}
                        style={{
                          width: '100%',
                          padding: '12px 40px 12px 16px',
                          background: 'var(--surface-container-low)',
                          border: '1px solid var(--outline-variant)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: 'var(--body-md)',
                          fontFamily: 'var(--font-family)',
                          color: 'var(--on-surface)',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        disabled={regLoading || regSuccess}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--outline)',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                          {showRegPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label htmlFor="confirmPassword" style={{
                      fontSize: 'var(--label-md)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--on-surface-variant)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Confirmar Palavra-passe *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={regForm.confirmPassword}
                        onChange={handleRegInputChange}
                        placeholder="Repetir palavra-passe"
                        required
                        disabled={regLoading || regSuccess}
                        style={{
                          width: '100%',
                          padding: '12px 40px 12px 16px',
                          background: 'var(--surface-container-low)',
                          border: '1px solid var(--outline-variant)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: 'var(--body-md)',
                          fontFamily: 'var(--font-family)',
                          color: 'var(--on-surface)',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={regLoading || regSuccess}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--outline)',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                          {showConfirmPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Termos e Condições */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-2)',
                  cursor: regLoading || regSuccess ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--body-sm)',
                  color: 'var(--on-surface-variant)',
                  opacity: regLoading || regSuccess ? 0.7 : 1
                }}>
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={e => setAcceptedTerms(e.target.checked)}
                    disabled={regLoading || regSuccess}
                    style={{
                      width: '16px',
                      height: '16px',
                      accentColor: 'var(--primary)',
                      cursor: regLoading || regSuccess ? 'not-allowed' : 'pointer',
                      marginTop: '2px',
                      flexShrink: 0
                    }}
                  />
                  <span>
                    Declaro que os dados fornecidos são verdadeiros e aceito os{' '}
                    <Link to="/terms" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                      Termos de Uso
                    </Link>
                    {' '}e a{' '}
                    <Link to="/privacy" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                      Política de Privacidade
                    </Link>
                    {' '}do SGPMC.
                  </span>
                </label>

                {/* Botões de ação */}
                <div style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  marginTop: 'var(--space-2)'
                }}>
                  {/* Botão Voltar (apenas para demo) */}
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    disabled={regLoading || regSuccess}
                    style={{
                      padding: '12px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      fontFamily: 'var(--font-family)',
                      fontSize: 'var(--body-md)',
                      fontWeight: 'var(--font-semibold)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--outline-variant)',
                      background: 'var(--surface-container-low)',
                      color: 'var(--on-surface)',
                      cursor: regLoading || regSuccess ? 'not-allowed' : 'pointer',
                      opacity: regLoading || regSuccess ? 0.5 : 1
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                    Voltar
                  </button>

                  {/* Botão Submeter Registo */}
                  <button
                    type="submit"
                    disabled={regLoading || regSuccess}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--space-1)',
                      fontFamily: 'var(--font-family)',
                      fontSize: 'var(--body-lg)',
                      fontWeight: 'var(--font-bold)',
                      borderRadius: 'var(--radius-lg)',
                      border: 'none',
                      cursor: regLoading || regSuccess ? 'not-allowed' : 'pointer',
                      opacity: regLoading || regSuccess ? 0.8 : 1,
                      letterSpacing: '0.02em',
                      transition: 'all 0.2s ease',
                      background: 'var(--primary)',
                      color: 'var(--on-primary)'
                    }}
                    onMouseEnter={e => {
                      if (!regLoading && !regSuccess) {
                        e.currentTarget.style.boxShadow = 'var(--elevation-3)'
                        e.currentTarget.style.transform = 'scale(1.02)'
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    {regLoading ? (
                      <>
                        <span style={{
                          width: '18px',
                          height: '18px',
                          border: '2px solid var(--on-primary)',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite'
                        }} />
                        A submeter...
                      </>
                    ) : regSuccess ? (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
                        Concluído!
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>how_to_reg</span>
                        Completar Registo
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

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

      <style>{`
        @keyframes spin { 
          to { transform: rotate(360deg); } 
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}