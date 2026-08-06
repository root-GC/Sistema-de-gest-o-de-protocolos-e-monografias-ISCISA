// src/pages/RegisterPage.tsx
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/authService'
import { registrationDataService } from '../services/registrationDataService'
import { LoadingSpinner } from '../components/LoadingSpinner'
import '../styles/global.css'

type UserType = 'student' | 'teacher'

interface Option { 
  id: number
  name: string 
}

interface ScientificAreaOption extends Option {
  organ_id?: number
  organ?: {
    id: number
    name: string
    type: string
  }
}

interface SupervisorOption extends Option {
  academic_degree?: string
}

export default function RegisterPage() {
  const navigate = useNavigate()

  const [type, setType] = useState<UserType>('student')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Estudante
  const [courseId, setCourseId] = useState('')
  const [supervisorId, setSupervisorId] = useState('')
  const [studentNumber, setStudentNumber] = useState('')

  // Docente
  const [scientificAreaId, setScientificAreaId] = useState('')
  const [academicDegree, setAcademicDegree] = useState('')

  const [courses, setCourses] = useState<Option[]>([])
  const [scientificAreas, setScientificAreas] = useState<ScientificAreaOption[]>([])
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([])

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    Promise.all([
      registrationDataService.courses(),
      registrationDataService.scientificAreas(),
      registrationDataService.supervisors(),
    ])
      .then(([c, sa, s]) => {
        setCourses(c)
        setScientificAreas(sa)
        setSupervisors(s)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoadingData(false))
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password !== passwordConfirmation) {
      setError('As palavras-passe não coincidem.')
      return
    }

    if (password.length < 8) {
      setError('A palavra-passe deve ter pelo menos 8 caracteres.')
      return
    }

    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        type,
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      }

      if (type === 'student') {
        payload.course_id = Number(courseId)
        payload.supervisor_id = Number(supervisorId)
        payload.student_number = studentNumber
        
        // O órgão será determinado automaticamente pelo backend
        // baseado na área científica do curso
      } else {
        payload.scientific_area_id = Number(scientificAreaId)
        payload.academic_degree = academicDegree
        
        // O órgão será determinado automaticamente pelo backend
        // baseado na área científica selecionada
      }

      const res = await authService.register(payload as any)
      navigate('/verify-otp', { state: { email: res.email } })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  // Loading inicial dos dados do formulário
  if (loadingData) {
    return <LoadingSpinner variant="page" text="A carregar formulário..." />
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: 'var(--surface-container-lowest)',
    border: '1px solid var(--outline-variant)',
    borderRadius: 'var(--radius-lg)',
    fontSize: 'var(--body-md)',
    fontFamily: 'var(--font-family)',
    color: 'var(--on-surface)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 'var(--label-md)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--on-surface-variant)',
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--background)',
      fontFamily: 'var(--font-family)',
    }}>
      {/* Overlay de loading ao submeter */}
      {loading && <LoadingSpinner variant="overlay" text="A criar conta..." />}

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

      <main style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        padding: 'var(--space-5) var(--margin-mobile)',
        position: 'relative',
        zIndex: 10,
        overflow: 'auto'
      }}>
        <div style={{ width: '100%', maxWidth: '560px' }}>
          
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
              Criar Conta
            </h1>
            <p style={{
              fontSize: 'var(--body-md)',
              color: 'var(--on-surface-variant)',
              maxWidth: '360px',
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              Registo no Sistema de Gestão de Protocolos e Monografias Científicos
            </p>
          </div>

          <div className="card" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--surface-container-high)',
            padding: 'var(--space-4)',
          }}>
            {/* Tipo de conta */}
            <div style={{
              display: 'flex',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-3)',
              background: 'var(--surface-container-low)',
              padding: '4px',
              borderRadius: 'var(--radius-lg)',
            }}>
              {(['student', 'teacher'] as UserType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: type === t ? 'var(--primary)' : 'transparent',
                    color: type === t ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                    fontFamily: 'var(--font-family)',
                    fontSize: 'var(--body-md)',
                    fontWeight: type === t ? 'var(--font-semibold)' : 'var(--font-medium)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {t === 'student' ? 'school' : 'cast_for_education'}
                  </span>
                  {t === 'student' ? 'Estudante' : 'Docente'}
                </button>
              ))}
            </div>

            {error && (
              <div className="badge badge-error" role="alert" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', marginBottom: 'var(--space-3)',
                fontSize: 'var(--body-md)', animation: 'slideUp 0.3s ease'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {/* Informações básicas */}
              <div style={{
                background: 'var(--surface-container-low)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-lg)',
                opacity: loading ? 0.7 : 1,
                pointerEvents: loading ? 'none' : 'auto'
              }}>
                <h3 style={{
                  fontSize: 'var(--body-lg)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--on-surface)',
                  marginBottom: 'var(--space-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person</span>
                  Informações Pessoais
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={labelStyle}>Nome completo *</label>
                    <input
                      style={inputStyle}
                      placeholder="Ex: João Silva"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      disabled={loading}
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={labelStyle}>Email institucional *</label>
                    <input
                      type="email"
                      style={inputStyle}
                      placeholder="exemplo@iscisa.ac.mz"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      disabled={loading}
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
              </div>

              {/* Palavra-passe */}
              <div style={{
                background: 'var(--surface-container-low)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-lg)',
                opacity: loading ? 0.7 : 1,
                pointerEvents: loading ? 'none' : 'auto'
              }}>
                <h3 style={{
                  fontSize: 'var(--body-lg)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--on-surface)',
                  marginBottom: 'var(--space-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock</span>
                  Segurança
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={labelStyle}>Palavra-passe *</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        style={inputStyle}
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={8}
                        disabled={loading}
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
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={labelStyle}>Confirmar *</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        style={inputStyle}
                        placeholder="Repita a senha"
                        value={passwordConfirmation}
                        onChange={e => setPasswordConfirmation(e.target.value)}
                        required
                        minLength={8}
                        disabled={loading}
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
                  
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 'var(--body-md)',
                    color: 'var(--on-surface-variant)',
                  }}>
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={e => setShowPassword(e.target.checked)}
                      disabled={loading}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: 'var(--primary)',
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    />
                    Mostrar palavra-passe
                  </label>
                </div>
              </div>

              {/* Campos específicos */}
              <div style={{
                background: 'var(--surface-container-low)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-lg)',
                opacity: loading ? 0.7 : 1,
                pointerEvents: loading ? 'none' : 'auto'
              }}>
                <h3 style={{
                  fontSize: 'var(--body-lg)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--on-surface)',
                  marginBottom: 'var(--space-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {type === 'student' ? 'school' : 'badge'}
                  </span>
                  {type === 'student' ? 'Dados Académicos' : 'Dados Profissionais'}
                </h3>

                {type === 'student' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={labelStyle}>Número de estudante *</label>
                      <input
                        style={inputStyle}
                        placeholder="Ex: 01.4038.2023"
                        value={studentNumber}
                        onChange={e => setStudentNumber(e.target.value)}
                        required
                        disabled={loading}
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={labelStyle}>Curso *</label>
                      <select
                        style={inputStyle}
                        value={courseId}
                        onChange={e => setCourseId(e.target.value)}
                        required
                        disabled={loading}
                      >
                        <option value="">Seleccione o curso</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={labelStyle}>Orientador / Supervisor *</label>
                      <select
                        style={inputStyle}
                        value={supervisorId}
                        onChange={e => setSupervisorId(e.target.value)}
                        required
                        disabled={loading}
                      >
                        <option value="">Seleccione o supervisor</option>
                        {supervisors.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name}{s.academic_degree ? ` (${s.academic_degree})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={labelStyle}>Área científica *</label>
                      <select
                        style={inputStyle}
                        value={scientificAreaId}
                        onChange={e => setScientificAreaId(e.target.value)}
                        required
                        disabled={loading}
                      >
                        <option value="">Seleccione a área</option>
                        {scientificAreas.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                            {a.organ?.name && ` (${a.organ.name})`}
                          </option>
                        ))}
                      </select>
                      <span style={{ 
                        fontSize: 'var(--label-sm)', 
                        color: 'var(--on-surface-variant)',
                        marginTop: '2px'
                      }}>
                        A área científica determina automaticamente o teu órgão (Núcleo Científico)
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={labelStyle}>Grau académico *</label>
                      <select
                        style={inputStyle}
                        value={academicDegree}
                        onChange={e => setAcademicDegree(e.target.value)}
                        required
                        disabled={loading}
                      >
                        <option value="">Seleccione o grau</option>
                        <option value="licenciatura">Licenciatura</option>
                        <option value="mestrado">Mestrado</option>
                        <option value="doutoramento">Doutoramento</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Info sobre o órgão */}
             

              {/* Botão Submeter */}
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
                  opacity: loading ? 0.8 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--elevation-2)',
                  marginTop: 'var(--space-2)'
                }}
                onMouseEnter={e => {
                  if (!loading) {
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
                    A criar conta...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
                    Criar Conta
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
              Já tem conta?{' '}
              <Link
                to="/login"
                style={{
                  color: 'var(--primary)',
                  fontWeight: 'var(--font-semibold)',
                  textDecoration: 'none',
                  marginLeft: '4px',
                  transition: 'text-decoration 0.2s',
                  pointerEvents: loading ? 'none' : 'auto'
                }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
              >
                Entrar
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