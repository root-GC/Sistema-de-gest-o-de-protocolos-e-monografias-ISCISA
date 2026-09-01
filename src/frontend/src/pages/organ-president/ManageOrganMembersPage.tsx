// src/pages/organ-president/ManageOrganMembersPage.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { adminService } from '../../services/adminService'
import { generalAdminService } from '../../services/generalAdminService'
import { getOrganConfig } from './organPresidentConfig'
import '../../styles/global.css'

const ROLE_LABELS: Record<string, string> = {
  president: 'Presidente',
  vice_president: 'Vice-Presidente',
  reviewer: 'Revisor',
  member: 'Membro',
  secretary: 'Secretário/a',
}

const ROLE_COLORS: Record<string, string> = {
  president: 'var(--primary)',
  vice_president: 'var(--tertiary)',
  reviewer: 'var(--primary)',
  member: 'var(--outline)',
  secretary: 'var(--secondary)',
}

interface OrganMember {
  id: number
  name: string
  email: string
  status: string
  role: string
  organ_id: number
}

interface ScientificArea {
  id: number
  name: string
  organ_id: number
}

export default function ManageOrganMembersPage() {
  const { profiles } = useAuth()
  const [members, setMembers] = useState<OrganMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')

  // Adicionar Secretário/a
  const [showInviteSecretary, setShowInviteSecretary] = useState(false)
  const [secretaryName, setSecretaryName] = useState('')
  const [secretaryEmail, setSecretaryEmail] = useState('')
  const [secretaryAreaId, setSecretaryAreaId] = useState<number | null>(null)
  const [secretaryOffice, setSecretaryOffice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Áreas científicas do órgão
  const [organAreas, setOrganAreas] = useState<ScientificArea[]>([])
  
  // Editar secretário/a
  const [showEditSecretary, setShowEditSecretary] = useState(false)
  const [editingSecretaryId, setEditingSecretaryId] = useState<number | null>(null)
  const [editAreaId, setEditAreaId] = useState<number | null>(null)
  const [editOffice, setEditOffice] = useState('')

  const organType = profiles?.admin?.organ?.type || 'scientific_committee'
  const organId = (profiles?.admin as any)?.organ_id || profiles?.admin?.organ?.id
  const organScope = profiles?.admin?.organ?.name || ''
  const config = getOrganConfig(organType)

  // Verificar se o órgão é Núcleo Científico
  const isNucleoCientifico = organScope?.toLowerCase().includes('núcleo científico')

  useEffect(() => { 
    if (organId) {
      loadMembers()
      if (isNucleoCientifico) {
        loadOrganAreas()
      }
    }
  }, [organId])

  async function loadOrganAreas() {
    try {
      const response = await generalAdminService.listAllAreas()
      const areas = Array.isArray(response?.data) ? response.data : 
                    Array.isArray(response) ? response : []
      // Filtrar apenas áreas do órgão atual
      setOrganAreas(areas.filter((a: any) => a.organ_id === organId))
    } catch (e) {
      console.error('Erro ao carregar áreas científicas:', e)
    }
  }

  async function loadMembers() {
    setLoading(true)
    setError(null)
    try {
      // Buscar todos os admins
      const adminsResponse = await adminService.listUsers({ role: 'admin' })
      const adminsData = Array.isArray(adminsResponse?.data) ? adminsResponse.data : 
                         Array.isArray(adminsResponse) ? adminsResponse : []
      
      // Buscar secretários do órgão
      const secResponse = await generalAdminService.listSecretaries()
      const secretariesData = Array.isArray(secResponse?.data) ? secResponse.data : 
                              Array.isArray(secResponse) ? secResponse : []

      const organMembers: OrganMember[] = []

      // Adicionar admins do órgão
      adminsData.forEach((u: any) => {
        const adminProf = u.profiles?.admin || u.adminProfile || u.admin_profile
        if (adminProf?.organ_id === organId) {
          organMembers.push({
            id: u.id,
            name: u.name,
            email: u.email,
            status: u.status,
            role: 'president',
            organ_id: organId
          })
        }
      })

      // Adicionar secretários do órgão (já filtrado pelo backend)
      secretariesData.forEach((s: any) => {
        const profile = s.secretary_profile || {}
        // O backend já filtra por organ_id, mas verificamos por segurança
        if (profile.organ_id === organId || s.organ_id === organId) {
          organMembers.push({
            id: s.id,
            name: s.user?.name || s.name,
            email: s.user?.email || s.email,
            status: s.user?.status || s.status,
            role: 'secretary',
            organ_id: organId
          })
        }
      })

      setMembers(organMembers)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function openInviteSecretary() {
    setShowInviteSecretary(true)
    setSecretaryName('')
    setSecretaryEmail('')
    setSecretaryAreaId(null)
    setSecretaryOffice('')
  }

  function openEditSecretary(member: OrganMember) {
    // Encontrar o secretário nos dados completos
    const secretaryData = members.find(m => m.id === member.id && m.role === 'secretary')
    if (!secretaryData) return

    setEditingSecretaryId(member.id)
    setEditAreaId(null) // Será preenchido se disponível
    setEditOffice('')
    setShowEditSecretary(true)
  }

  async function handleInviteSecretary(e: React.FormEvent) {
    e.preventDefault()
    if (!secretaryName || !secretaryEmail) return
    setIsSubmitting(true)
    setError(null)
    try {
      const payload: any = {
        name: secretaryName,
        email: secretaryEmail,
      }

      // Só enviar scientific_area_id se for Núcleo Científico E tiver área selecionada
      if (isNucleoCientifico && secretaryAreaId) {
        payload.scientific_area_id = secretaryAreaId
      }

      // Adicionar office se preenchido
      if (secretaryOffice.trim()) {
        payload.office = secretaryOffice.trim()
      }

      await generalAdminService.createSecretary(payload)
      setSuccessMessage('Secretário/a adicionado/a com sucesso! Email enviado.')
      setShowInviteSecretary(false)
      loadMembers()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e: any) {
      setError(e?.message || 'Erro ao adicionar secretário/a.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateSecretary(e: React.FormEvent) {
    e.preventDefault()
    if (!editingSecretaryId) return
    setIsSubmitting(true)
    setError(null)
    try {
      await generalAdminService.updateSecretary(editingSecretaryId, {
        scientific_area_id: editAreaId || null,
        office: editOffice || undefined,
      })
      setSuccessMessage('Secretário/a atualizado/a!')
      setShowEditSecretary(false)
      loadMembers()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e: any) {
      setError(e?.message || 'Erro ao atualizar secretário/a.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemoveMember(memberId: number, role: string) {
    const confirmMessage = role === 'secretary' 
      ? 'Tem certeza que deseja remover este/a secretário/a?'
      : 'Tem certeza que deseja remover este membro?'
    
    if (!window.confirm(confirmMessage)) return
    
    try {
      if (role === 'secretary') {
        // Usar o endpoint específico para remover secretário
        await generalAdminService.removeSecretary(memberId)
      } else {
        await adminService.deleteUser(memberId)
      }
      setSuccessMessage('Membro removido!')
      loadMembers()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const filteredMembers = members.filter(m => {
    const matchesSearch = !searchTerm || 
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || m.role === filterRole
    return matchesSearch && matchesRole
  })

  if (loading) return <Loader />

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>Membros do Órgão</h1>
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
          Gira os membros do {config.label}
          {isNucleoCientifico && ' • Núcleo Científico'}
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {successMessage && <Alert type="success">{successMessage}</Alert>}

      {/* Barra de Ações */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '20px' }}>search</span>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar membros..." style={{ width: '100%', padding: '10px 16px 10px 44px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ padding: '10px 14px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', cursor: 'pointer' }}>
          <option value="all">Todas as funções</option>
          <option value="president">Presidente</option>
          <option value="secretary">Secretário/a</option>
        </select>
        
        <button onClick={openInviteSecretary} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '10px 16px',
          background: 'var(--primary)', color: 'var(--on-primary)', border: 'none',
          borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontSize: 'var(--body-md)',
          fontWeight: 'var(--font-semibold)', fontFamily: 'var(--font-family)', whiteSpace: 'nowrap'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>mail</span>
          Adicionar Secretário/a
        </button>
      </div>

      {/* Modal: Adicionar Secretário/a */}
      {showInviteSecretary && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3)' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', width: '100%', maxWidth: '500px', maxHeight: '85vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>mail</span>
              Adicionar Secretário/a
            </h2>
            <form onSubmit={handleInviteSecretary} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <FormField label="Nome *" value={secretaryName} onChange={setSecretaryName} required />
              <FormField label="Email *" value={secretaryEmail} onChange={setSecretaryEmail} type="email" required />
              
              {/* Campo de Área Científica - SÓ aparece se for Núcleo Científico */}
              {isNucleoCientifico && organAreas.length > 0 && (
                <FormSelect
                  label="Área Científica (opcional)"
                  value={String(secretaryAreaId || '')}
                  onChange={v => setSecretaryAreaId(v ? Number(v) : null)}
                  options={[
                    { value: '', label: 'Nenhuma (todo o órgão)' },
                    ...organAreas.map(a => ({ value: String(a.id), label: a.name }))
                  ]}
                />
              )}

              <FormField label="Gabinete / Secretaria" value={secretaryOffice} onChange={setSecretaryOffice} placeholder="Ex: Secretaria do Núcleo" />
              
              {/* Info sobre o órgão */}
              <div style={{
                padding: 'var(--space-2)', 
                background: 'var(--surface-container)', 
                borderRadius: 'var(--radius-lg)', 
                fontSize: 'var(--label-sm)', 
                color: 'var(--on-surface-variant)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_balance</span>
                Órgão: <strong>{organScope}</strong>
              </div>

              <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', background: 'var(--tertiary-container)', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', margin: 0 }}>
                📧 Um email será enviado com um link para definir a senha. O órgão será automaticamente atribuído.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowInviteSecretary(false)} className="btn">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'A adicionar...' : 'Adicionar Secretário/a'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Secretário/a */}
      {showEditSecretary && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3)' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>
              Editar Secretário/a
            </h2>
            <form onSubmit={handleUpdateSecretary} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {/* Campo de Área Científica - SÓ aparece se for Núcleo Científico */}
              {isNucleoCientifico && organAreas.length > 0 && (
                <FormSelect
                  label="Área Científica"
                  value={String(editAreaId || '')}
                  onChange={v => setEditAreaId(v ? Number(v) : null)}
                  options={[
                    { value: '', label: 'Nenhuma (todo o órgão)' },
                    ...organAreas.map(a => ({ value: String(a.id), label: a.name }))
                  ]}
                />
              )}
              
              <FormField label="Gabinete / Secretaria" value={editOffice} onChange={setEditOffice} placeholder="Ex: Secretaria do Núcleo" />
              
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowEditSecretary(false)} className="btn">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'A guardar...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Membros */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {filteredMembers.length === 0 ? (
          <EmptyState message="Nenhum membro encontrado" />
        ) : (
          filteredMembers.map(member => (
            <div key={`${member.id}-${member.role}`} className="card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--font-bold)', flexShrink: 0, color: 'var(--on-primary-container)' }}>
                  {member.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0 }}>{member.name}</h3>
                    <span style={{ fontSize: 'var(--label-sm)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: ROLE_COLORS[member.role] || 'var(--surface-container)', color: 'white', fontWeight: 'var(--font-medium)' }}>
                      {ROLE_LABELS[member.role] || member.role}
                    </span>
                    {member.status === 'inactive' && (
                      <span style={{ fontSize: 'var(--label-sm)', background: 'var(--error-container)', color: 'var(--on-error-container)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>Inativo/a</span>
                    )}
                  </div>
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>{member.email}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {member.role === 'secretary' && (
                  <button onClick={() => openEditSecretary(member)} style={{ padding: '6px 12px', background: 'var(--surface-container)', color: 'var(--on-surface-variant)', border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontSize: 'var(--label-sm)', fontFamily: 'var(--font-family)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                    Editar
                  </button>
                )}
                <button onClick={() => handleRemoveMember(member.id, member.role)} style={{ padding: '6px 12px', background: 'var(--error-container)', color: 'var(--on-error-container)', border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontSize: 'var(--label-sm)', fontFamily: 'var(--font-family)' }}>
                  Remover
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span style={{ width: '24px', height: '24px', border: '3px solid var(--outline-variant)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

function Alert({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <div style={{ padding: 'var(--space-2) var(--space-3)', marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: type === 'error' ? 'var(--error-container)' : 'var(--primary-container)', color: type === 'error' ? 'var(--on-error-container)' : 'var(--on-primary-container)', fontSize: 'var(--body-md)' }}>{children}</div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-5)', color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--outline-variant)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>group_off</span>
      <p>{message}</p>
    </div>
  )
}

function FormField({ label, value, onChange, type = 'text', placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} style={{ padding: '10px 14px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none' }} />
    </div>
  )
}

function FormSelect({ label, value, onChange, options, required, disabled, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  required?: boolean
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        style={{
          padding: '10px 14px',
          background: 'var(--surface-container-lowest)',
          border: '1px solid var(--outline-variant)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--body-md)',
          fontFamily: 'var(--font-family)',
          color: 'var(--on-surface)',
          outline: 'none',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        <option value="">{placeholder || 'Selecione...'}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
