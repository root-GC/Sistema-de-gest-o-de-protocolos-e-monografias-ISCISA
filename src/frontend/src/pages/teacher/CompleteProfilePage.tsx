// src/pages/teacher/CompleteProfilePage.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  teacherService, 
  ACADEMIC_DEGREES,
  teacherResponseToUserPayload 
} from '../../services/teacherService'
import '../../styles/global.css'

export default function CompleteProfilePage() {
  const navigate = useNavigate()
  const { user, profiles, updateUser, loading } = useAuth()
  
  const [department, setDepartment] = useState('')
  const [academicDegree, setAcademicDegree] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [missingFields, setMissingFields] = useState<string[]>([])
  
  // Preencher dados existentes e verificar campos em falta
  useEffect(() => {
    if (user) {
      setName(user.name || '')
      
      const teacherProfile = profiles?.teacher
      if (teacherProfile) {
        setDepartment(teacherProfile.department || '')
        setAcademicDegree(teacherProfile.academic_degree || '')
        
        // Determinar campos em falta
        const missing: string[] = []
        if (!teacherProfile.academic_degree) {
          missing.push('academic_degree')
        }
        if (!teacherProfile.department) {
          missing.push('department')
        }
        setMissingFields(missing)
      } else {
        // Se não tem perfil, ambos os campos estão em falta
        setMissingFields(['academic_degree', 'department'])
      }
    }
  }, [user, profiles])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validações
    if (!name.trim()) {
      setError('O nome é obrigatório.')
      return
    }
    
    if (!department.trim()) {
      setError('O departamento é obrigatório.')
      return
    }
    
    if (!academicDegree) {
      setError('O grau académico é obrigatório.')
      return
    }
    
    setSubmitting(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      // Usar o teacherService para completar o perfil
      const response = await teacherService.completeProfile({
        name: name.trim(),
        department: department.trim(),
        academic_degree: academicDegree,
      })

      console.log('✅ Perfil atualizado:', response.data)

      // Converter resposta do backend para UserPayload
      if (response.data) {
        // Criar UserPayload atual para passar como fallback
        const currentUserPayload = user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          roles: [],
          permissions: [],
          profiles: profiles || {}
        } : null;
        
        const userPayload = teacherResponseToUserPayload(
          response.data,
          currentUserPayload
        );
        
        updateUser(userPayload);
      }
      
      setSuccessMessage('Perfil completado com sucesso!')
      
      // Redirecionar após um breve delay
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 1500)
      
    } catch (err) {
      console.error('❌ Erro ao completar perfil:', err)
      
      // Melhor tratamento de erro
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Erro ao completar perfil. Tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'var(--font-family)',
        background: 'var(--surface-container-low)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ 
            width: '32px', 
            height: '32px', 
            border: '3px solid var(--outline-variant)', 
            borderTopColor: 'var(--primary)', 
            borderRadius: 'var(--radius-full)', 
            animation: 'spin 0.8s linear infinite',
            display: 'inline-block'
          }} />
          <p style={{ 
            marginTop: 'var(--space-2)', 
            color: 'var(--on-surface-variant)',
            fontSize: 'var(--body-md)'
          }}>
            A carregar...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--surface-container-low) 0%, var(--surface-container) 100%)',
      fontFamily: 'var(--font-family)',
      padding: 'var(--space-3)'
    }}>
      <div style={{ 
        maxWidth: '520px', 
        width: '100%',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-4)',
        boxShadow: 'var(--elevation-3)'
      }}>
        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          <div>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKW98T0QI3yiR-05Z-BoA6n6AKFK_0ZdAqs1kfapv1inuADxNU7iCp-dKMIMkUti0n9BuBbzOugqpZmuRFq8g0e6hIiwvgFJ3EMlGTBhVTYkjNfkmlUWZEDkXFSNZ59ZVenTCv8hw2KrROVZkKZort3wvb3rQ862iCLbpMPGaiHh1LsvhPKbtxDNFe4jRGObM0eeFiO0gYIZ0z1ac0X6dncZ6JWoUI0NGRm5BtnK_SSPldMEHABk8gTnp6gZnGB41fWkONkURhR3I"
              alt="Logo ISCISA"
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto var(--space-2)',
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
              lineHeight: 1.5,
              marginBottom: 'var(--space-2)'
            }}>
              Sistema de Gestão de Protocolos e Monografias Científicos
            </p>
          </div>
          
          <h1 style={{ 
            fontSize: 'var(--headline-lg)', 
            fontWeight: 'var(--font-semibold)',
            color: 'var(--on-surface)',
            marginBottom: 'var(--space-1)'
          }}>
            Complete o seu perfil
          </h1>
          
          <p style={{ 
            fontSize: 'var(--body-md)', 
            color: 'var(--on-surface-variant)',
            lineHeight: 1.5
          }}>
            Para continuar a utilizar a plataforma, é necessário completar os seus dados profissionais.
          </p>
        </div>

        {/* Campos em falta */}
        {missingFields.length > 0 && (
          <div style={{ 
            padding: 'var(--space-2) var(--space-3)', 
            marginBottom: 'var(--space-3)', 
            borderRadius: 'var(--radius-lg)', 
            background: 'var(--tertiary-container)', 
            color: 'var(--on-tertiary-container)', 
            fontSize: 'var(--body-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>warning</span>
            <div>
              <strong>Campos em falta:</strong>
              <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                {missingFields.includes('academic_degree') && (
                  <li>Grau Académico</li>
                )}
                {missingFields.includes('department') && (
                  <li>Departamento</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Alertas */}
        {error && (
          <div role="alert" style={{ 
            padding: 'var(--space-2) var(--space-3)', 
            marginBottom: 'var(--space-3)', 
            borderRadius: 'var(--radius-lg)', 
            background: 'var(--error-container)', 
            color: 'var(--on-error-container)', 
            fontSize: 'var(--body-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{ 
            padding: 'var(--space-2) var(--space-3)', 
            marginBottom: 'var(--space-3)', 
            borderRadius: 'var(--radius-lg)', 
            background: 'var(--primary-container)', 
            color: 'var(--on-primary-container)', 
            fontSize: 'var(--body-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
            {successMessage}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Nome */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label htmlFor="name" style={{ 
              fontSize: 'var(--label-md)', 
              fontWeight: 'var(--font-medium)', 
              color: 'var(--on-surface-variant)' 
            }}>
              Nome Completo *
            </label>
            <input 
              id="name"
              type="text"
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Ex: João Carlos Silva"
              required
              disabled={submitting}
              autoComplete="name"
              style={{ 
                padding: '12px 14px', 
                background: 'var(--surface-container-lowest)', 
                border: '1px solid var(--outline-variant)', 
                borderRadius: 'var(--radius-lg)', 
                fontSize: 'var(--body-md)', 
                fontFamily: 'var(--font-family)', 
                color: 'var(--on-surface)', 
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                opacity: submitting ? 0.7 : 1,
                width: '100%',
                boxSizing: 'border-box'
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--primary)'
                e.target.style.boxShadow = '0 0 0 3px var(--primary-container)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--outline-variant)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
          
          {/* Departamento */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label htmlFor="department" style={{ 
              fontSize: 'var(--label-md)', 
              fontWeight: 'var(--font-medium)', 
              color: 'var(--on-surface-variant)' 
            }}>
              Departamento *
            </label>
            <input 
              id="department"
              type="text"
              value={department} 
              onChange={e => setDepartment(e.target.value)} 
              placeholder="Ex: Departamento de Ciências Biomédicas"
              required
              disabled={submitting}
              maxLength={150}
              style={{ 
                padding: '12px 14px', 
                background: 'var(--surface-container-lowest)', 
                border: '1px solid var(--outline-variant)', 
                borderRadius: 'var(--radius-lg)', 
                fontSize: 'var(--body-md)', 
                fontFamily: 'var(--font-family)', 
                color: 'var(--on-surface)', 
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                opacity: submitting ? 0.7 : 1,
                width: '100%',
                boxSizing: 'border-box'
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--primary)'
                e.target.style.boxShadow = '0 0 0 3px var(--primary-container)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--outline-variant)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
          
          {/* Grau Académico */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label htmlFor="academic_degree" style={{ 
              fontSize: 'var(--label-md)', 
              fontWeight: 'var(--font-medium)', 
              color: 'var(--on-surface-variant)' 
            }}>
              Grau Académico *
            </label>
            <select
              id="academic_degree"
              value={academicDegree}
              onChange={e => setAcademicDegree(e.target.value)}
              required
              disabled={submitting}
              style={{
                padding: '12px 14px',
                background: 'var(--surface-container-lowest)',
                border: '1px solid var(--outline-variant)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--body-md)',
                fontFamily: 'var(--font-family)',
                color: 'var(--on-surface)',
                outline: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                opacity: submitting ? 0.7 : 1,
                width: '100%',
                boxSizing: 'border-box',
                appearance: 'auto'
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--primary)'
                e.target.style.boxShadow = '0 0 0 3px var(--primary-container)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--outline-variant)'
                e.target.style.boxShadow = 'none'
              }}
            >
              <option value="">— Selecione —</option>
              {ACADEMIC_DEGREES.map(degree => (
                <option key={degree} value={degree.toLowerCase()}>
                  {degree}
                </option>
              ))}
            </select>
          </div>

          {/* Informação sobre área científica */}
          {profiles?.teacher?.scientific_area && (
            <div style={{ 
              padding: 'var(--space-2) var(--space-3)', 
              background: 'var(--surface-container)', 
              borderRadius: 'var(--radius-lg)', 
              fontSize: 'var(--label-md)', 
              color: 'var(--on-surface-variant)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>science</span>
              <span>
                Área Científica: <strong>{profiles.teacher.scientific_area.name}</strong>
              </span>
            </div>
          )}

          {/* Aviso */}
          <div style={{ 
            padding: 'var(--space-2) var(--space-3)', 
            background: 'var(--tertiary-container)', 
            borderRadius: 'var(--radius-lg)', 
            fontSize: 'var(--label-md)', 
            color: 'var(--on-tertiary-container)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>info</span>
            <span>
              Preencha as informações abaixo. Após concluir, todas as funcionalidades serão desbloqueadas.
            </span>
          </div>

          {/* Botão */}
          <button 
            type="submit" 
            disabled={submitting}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 'var(--space-2)', 
              padding: '14px 20px', 
              background: 'var(--primary)', 
              color: 'var(--on-primary)', 
              border: 'none', 
              borderRadius: 'var(--radius-lg)', 
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--body-lg)',
              fontWeight: 'var(--font-semibold)',
              opacity: submitting ? 0.7 : 1,
              transition: 'all 0.2s ease',
              width: '100%',
              boxShadow: 'var(--elevation-1)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={e => { 
              if (!submitting) {
                e.currentTarget.style.background = 'var(--primary-fixed-dim)'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = 'var(--elevation-2)'
              }
            }}
            onMouseLeave={e => { 
              if (!submitting) {
                e.currentTarget.style.background = 'var(--primary)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--elevation-1)'
              }
            }}
            onMouseDown={e => {
              if (!submitting) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--elevation-1)'
              }
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {submitting ? 'hourglass_top' : 'check_circle'}
            </span>
            {submitting ? 'A guardar...' : 'Completar Perfil'}
          </button>

          {/* Nota de segurança */}
          <p style={{ 
            fontSize: 'var(--label-sm)', 
            color: 'var(--on-surface-variant)',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.4
          }}>
            <span className="material-symbols-outlined" style={{ 
              fontSize: '14px', 
              verticalAlign: 'middle',
              marginRight: '4px'
            }}>
              lock
            </span>
            Esta informação é necessária para desbloquear todas as funcionalidades da plataforma.
          </p>
        </form>
      </div>
    </div>
  )
}