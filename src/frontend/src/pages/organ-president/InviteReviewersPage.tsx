// src/pages/organ-president/InviteReviewersPage.tsx
import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { organPresidentService } from '../../services/organPresidentService'
import { getOrganConfig } from './organPresidentConfig'
import '../../styles/global.css'

interface Teacher {
  id: number
  name: string
  email: string
  status: string
  academic_degree: string | null
  scientific_area: string | null
  scientific_area_id: number | null
}

interface OrganMember {
  id: number
  user_id: number
  organ_id: number
  role: string
  user?: {
    id: number
    name: string
    email: string
    status: string
  }
  created_at?: string
}

interface PaginationInfo {
  total: number
  current_page: number
  last_page: number
}

const ROLE_LABELS: Record<string, string> = {
  president: 'Presidente',
  coordinator: 'Coordenador',
  reviewer: 'Revisor',
  member: 'Membro',
  secretary: 'Secretário/a',
}

const ROLE_COLORS: Record<string, string> = {
  president: 'var(--primary)',
  coordinator: 'var(--tertiary)',
  reviewer: 'var(--secondary)',
  member: 'var(--outline)',
  secretary: 'var(--primary)',
}

const ROLE_OPTIONS = [
  { value: 'reviewer', label: 'Revisor' },
  { value: 'coordinator', label: 'Coordenador' },
  { value: 'member', label: 'Membro' },
]

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  pending: 'Pendente',
  inactive: 'Inativo',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'var(--primary-container)',
  pending: 'var(--tertiary-container)',
  inactive: 'var(--error-container)',
}

export default function InviteReviewersPage() {
  const { profiles } = useAuth()
  
  const [members, setMembers] = useState<OrganMember[]>([])
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    current_page: 1,
    last_page: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isInviting, setIsInviting] = useState<number | null>(null)
  const [isRemoving, setIsRemoving] = useState<number | null>(null)
  const [isUpdating, setIsUpdating] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const organType = profiles?.admin?.organ?.type || 'scientific_committee'
  const config = getOrganConfig(organType)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadAvailableTeachers(currentPage, searchTerm)
  }, [currentPage])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [membersRes, teachersRes] = await Promise.all([
        organPresidentService.listOrganMembers(),
        organPresidentService.listAvailableTeachers(),
      ])
      
      const membersData = Array.isArray(membersRes?.data) 
        ? membersRes.data 
        : Array.isArray(membersRes) 
          ? membersRes 
          : []
      
      const teachersData = Array.isArray(teachersRes?.data) 
        ? teachersRes.data as Teacher[] 
        : Array.isArray(teachersRes) 
          ? teachersRes as Teacher[]
          : []

      setMembers(membersData)
      setAvailableTeachers(teachersData)
      
      // Atualizar informações de paginação
      if (teachersRes && typeof teachersRes === 'object' && !Array.isArray(teachersRes)) {
        setPagination({
          total: teachersRes.total || teachersData.length,
          current_page: teachersRes.current_page || 1,
          last_page: teachersRes.last_page || 1,
        })
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function loadAvailableTeachers(page: number = 1, search: string = '') {
    setError(null)
    try {
      const teachersRes = await organPresidentService.listAvailableTeachers()
      
      const teachersData = Array.isArray(teachersRes?.data) 
        ? teachersRes.data as Teacher[] 
        : Array.isArray(teachersRes) 
          ? teachersRes as Teacher[]
          : []

      setAvailableTeachers(teachersData)
      
      if (teachersRes && typeof teachersRes === 'object' && !Array.isArray(teachersRes)) {
        setPagination({
          total: teachersRes.total || teachersData.length,
          current_page: teachersRes.current_page || page,
          last_page: teachersRes.last_page || 1,
        })
      }
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Erro ao carregar docentes.'
      setError(errorMessage)
    }
  }

  async function handleInvite(teacherId: number) {
    setIsInviting(teacherId)
    setError(null)
    setSuccessMessage(null)
    try {
      const response = await organPresidentService.inviteReviewer(teacherId)
      const message = (response as any)?.message || 'Docente convidado como revisor!'
      setSuccessMessage(message)
      await loadData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Erro ao convidar docente.'
      setError(errorMessage)
    } finally {
      setIsInviting(null)
    }
  }

  async function handleRemoveMember(memberId: number, memberName?: string) {
    const name = memberName || 'este membro'
    if (!window.confirm(`Tem certeza que deseja remover ${name}?`)) return
    
    setIsRemoving(memberId)
    setError(null)
    setSuccessMessage(null)
    try {
      const response = await organPresidentService.removeOrganMember(memberId)
      const message = (response as any)?.message || 'Membro removido!'
      setSuccessMessage(message)
      await loadData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Erro ao remover membro.'
      setError(errorMessage)
    } finally {
      setIsRemoving(null)
    }
  }

  async function handleUpdateRole(memberId: number, newRole: string) {
    setIsUpdating(memberId)
    setError(null)
    setSuccessMessage(null)
    try {
      const response = await organPresidentService.updateOrganMember(memberId, { role: newRole })
      const message = (response as any)?.message || 'Função atualizada!'
      setSuccessMessage(message)
      await loadData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Erro ao atualizar função.'
      setError(errorMessage)
    } finally {
      setIsUpdating(null)
    }
  }

  const filteredTeachers = useMemo(() => {
    let filtered = availableTeachers
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(t => 
        t.name?.toLowerCase().includes(term) ||
        t.email?.toLowerCase().includes(term) ||
        t.scientific_area?.toLowerCase().includes(term) ||
        t.academic_degree?.toLowerCase().includes(term)
      )
    }
    
    return filtered
  }, [availableTeachers, searchTerm])

  if (loading) return <Loader />

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>
          Convidar Revisores
        </h1>
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
          Convide docentes do Núcleo Científico para serem revisores no {config.label}
        </p>
      </div>

      {error && <Alert type="error" onClose={() => setError(null)}>{error}</Alert>}
      {successMessage && <Alert type="success" onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>}

      {/* Membros atuais do órgão */}
      <section style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-2)'
        }}>
          <h2 style={{
            fontSize: 'var(--title-md)',
            fontWeight: 'var(--font-semibold)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>group</span>
            Membros do {config.label}
            <span style={{
              background: 'var(--surface-container)',
              padding: '2px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--label-sm)'
            }}>
              {members.length}
            </span>
          </h2>
        </div>

        {members.length === 0 ? (
          <EmptyState message="Nenhum membro no órgão" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {members.map(member => (
              <div key={member.id} className="card" style={{
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-3)',
                flexWrap: 'wrap',
                opacity: isRemoving === member.id || isUpdating === member.id ? 0.6 : 1,
                transition: 'opacity 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: ROLE_COLORS[member.role] || 'var(--primary-container)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'var(--font-bold)',
                    color: 'white',
                    flexShrink: 0
                  }}>
                    {member.user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0 }}>
                        {member.user?.name}
                      </h3>
                      <span style={{
                        fontSize: 'var(--label-xs)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: ROLE_COLORS[member.role] || 'var(--surface-container)',
                        color: 'white',
                        fontWeight: 'var(--font-medium)'
                      }}>
                        {ROLE_LABELS[member.role] || member.role}
                      </span>
                      {member.user?.status && (
                        <span style={{
                          fontSize: 'var(--label-xs)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: STATUS_COLORS[member.user.status] || 'var(--surface-container)',
                          color: 'var(--on-surface)',
                          fontWeight: 'var(--font-medium)'
                        }}>
                          {STATUS_LABELS[member.user.status] || member.user.status}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>
                      {member.user?.email}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <select
                    value={member.role}
                    onChange={e => handleUpdateRole(member.id, e.target.value)}
                    disabled={member.role === 'president' || isUpdating === member.id}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-full)',
                      border: `1px solid ${ROLE_COLORS[member.role] || 'var(--outline-variant)'}`,
                      fontSize: 'var(--label-sm)',
                      fontFamily: 'var(--font-family)',
                      background: 'var(--surface)',
                      color: 'var(--on-surface)',
                      cursor: member.role === 'president' ? 'not-allowed' : 'pointer',
                      opacity: member.role === 'president' ? 0.5 : 1,
                      minWidth: '130px'
                    }}
                  >
                    {ROLE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  
                  {member.role !== 'president' && (
                    <button
                      onClick={() => handleRemoveMember(member.id, member.user?.name)}
                      disabled={isRemoving === member.id}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--error-container)',
                        color: 'var(--on-error-container)',
                        border: 'none',
                        borderRadius: 'var(--radius-lg)',
                        cursor: isRemoving === member.id ? 'not-allowed' : 'pointer',
                        fontSize: 'var(--label-sm)',
                        fontFamily: 'var(--font-family)',
                        opacity: isRemoving === member.id ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isRemoving === member.id ? (
                        <>
                          <span style={{
                            width: '12px',
                            height: '12px',
                            border: '2px solid var(--on-error-container)',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                          }} />
                          A remover...
                        </>
                      ) : (
                        'Remover'
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Docentes disponíveis para convidar */}
      <section>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-3)'
        }}>
          <h2 style={{
            fontSize: 'var(--title-md)',
            fontWeight: 'var(--font-semibold)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)' }}>person_add</span>
            Docentes do Núcleo Científico
            <span style={{
              background: 'var(--tertiary-container)',
              padding: '2px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--label-sm)',
              color: 'var(--on-tertiary-container)'
            }}>
              {pagination.total} disponíveis
            </span>
          </h2>

          <div style={{ position: 'relative', minWidth: '250px' }}>
            <span className="material-symbols-outlined" style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--outline)',
              fontSize: '20px'
            }}>
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value)
                // Debounce para pesquisa
                setTimeout(() => {
                  loadAvailableTeachers(1, e.target.value)
                }, 500)
              }}
              placeholder="Pesquisar docentes..."
              style={{
                width: '100%',
                padding: '10px 14px 10px 40px',
                background: 'var(--surface-container-lowest)',
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

        {filteredTeachers.length === 0 ? (
          <EmptyState message={searchTerm ? 'Nenhum docente encontrado' : 'Todos os docentes já são membros'} />
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {filteredTeachers.map(teacher => (
                <div key={teacher.id} className="card" style={{
                  padding: 'var(--space-3) var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-3)',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--tertiary-container)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'var(--font-bold)',
                      color: 'var(--on-tertiary-container)',
                      flexShrink: 0
                    }}>
                      {teacher.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0 }}>
                          {teacher.name}
                        </h3>
                        {teacher.status && (
                          <span style={{
                            fontSize: 'var(--label-xs)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: STATUS_COLORS[teacher.status] || 'var(--surface-container)',
                            color: 'var(--on-surface)',
                            fontWeight: 'var(--font-medium)'
                          }}>
                            {STATUS_LABELS[teacher.status] || teacher.status}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>
                        {teacher.email}
                      </p>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: '2px' }}>
                        {teacher.academic_degree && (
                          <span style={{
                            fontSize: 'var(--label-xs)',
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--primary-container)',
                            color: 'var(--on-primary-container)',
                            fontWeight: 'var(--font-medium)'
                          }}>
                            {teacher.academic_degree}
                          </span>
                        )}
                        {teacher.scientific_area && (
                          <span style={{
                            fontSize: 'var(--label-xs)',
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--secondary-container)',
                            color: 'var(--on-secondary-container)',
                            fontWeight: 'var(--font-medium)'
                          }}>
                            {teacher.scientific_area}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleInvite(teacher.id)}
                    disabled={isInviting === teacher.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      padding: '8px 16px',
                      background: 'var(--secondary)',
                      color: 'var(--on-secondary)',
                      border: 'none',
                      borderRadius: 'var(--radius-lg)',
                      cursor: isInviting === teacher.id ? 'not-allowed' : 'pointer',
                      fontSize: 'var(--body-md)',
                      fontWeight: 'var(--font-semibold)',
                      fontFamily: 'var(--font-family)',
                      opacity: isInviting === teacher.id ? 0.7 : 1,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isInviting === teacher.id ? (
                      <>
                        <span style={{
                          width: '14px',
                          height: '14px',
                          border: '2px solid var(--on-secondary)',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite'
                        }} />
                        A convidar...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
                        Convidar como Revisor
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {pagination.last_page > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginTop: 'var(--space-3)'
              }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--surface-container)',
                    color: 'var(--on-surface)',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1,
                    fontFamily: 'var(--font-family)'
                  }}
                >
                  Anterior
                </button>
                
                <span style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>
                  Página {pagination.current_page} de {pagination.last_page}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                  disabled={currentPage === pagination.last_page}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--surface-container)',
                    color: 'var(--on-surface)',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    cursor: currentPage === pagination.last_page ? 'not-allowed' : 'pointer',
                    opacity: currentPage === pagination.last_page ? 0.5 : 1,
                    fontFamily: 'var(--font-family)'
                  }}
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span style={{
        width: '24px',
        height: '24px',
        border: '3px solid var(--outline-variant)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function Alert({ type, children, onClose }: { type: 'error' | 'success'; children: React.ReactNode; onClose?: () => void }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--space-2) var(--space-3)',
      marginBottom: 'var(--space-4)',
      borderRadius: 'var(--radius-lg)',
      background: type === 'error' ? 'var(--error-container)' : 'var(--primary-container)',
      color: type === 'error' ? 'var(--on-error-container)' : 'var(--on-primary-container)',
      fontSize: 'var(--body-md)'
    }}>
      <span>{children}</span>
      {onClose && (
        <button onClick={onClose} style={{ 
          background: 'none', 
          border: 'none', 
          color: 'inherit', 
          cursor: 'pointer', 
          fontSize: '18px', 
          padding: '0 4px',
          lineHeight: 1
        }}>
          ✕
        </button>
      )}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: 'var(--space-5)',
      color: 'var(--on-surface-variant)',
      background: 'var(--surface-container-low)',
      borderRadius: 'var(--radius-xl)',
      border: '1px dashed var(--outline-variant)'
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>
        group_off
      </span>
      <p>{message}</p>
    </div>
  )
}