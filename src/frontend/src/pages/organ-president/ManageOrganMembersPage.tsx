// src/pages/organ-president/ManageOrganMembersPage.tsx
import { useEffect, useState } from 'react'
import { organPresidentService, type OrganMember } from '../../services/organPresidentService'
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

export default function ManageOrganMembersPage() {
  const [members, setMembers] = useState<OrganMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')

  // ── Convidar Secretário/a ──
  const [showInviteSecretary, setShowInviteSecretary] = useState(false)
  const [secretaryName, setSecretaryName] = useState('')
  const [secretaryEmail, setSecretaryEmail] = useState('')
  const [secretaryOffice, setSecretaryOffice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Editar função ──
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null)
  const [editingRole, setEditingRole] = useState('')

  const organType = 'scientific_committee'
  const config = getOrganConfig(organType)

  useEffect(() => { loadMembers() }, [])

  async function loadMembers() {
    setLoading(true)
    try {
      // ⚠️ Mock data - AINDA NÃO EXISTE ROTA PARA LISTAR MEMBROS DO ÓRGÃO
      setMembers([
        { id: 1, user_id: 1, organ_id: 2, role: 'president', user: { id: 1, name: 'Dr. João Santos', email: 'joao@iscisa.ac.mz', status: 'active' }, joined_at: '2024-01-15' },
        { id: 2, user_id: 2, organ_id: 2, role: 'vice_president', user: { id: 2, name: 'Dra. Maria Silva', email: 'maria@iscisa.ac.mz', status: 'active' }, joined_at: '2024-01-15' },
        { id: 3, user_id: 3, organ_id: 2, role: 'reviewer', user: { id: 3, name: 'Prof. Ana Costa', email: 'ana@iscisa.ac.mz', status: 'active' }, joined_at: '2024-02-01' },
        { id: 4, user_id: 4, organ_id: 2, role: 'reviewer', user: { id: 4, name: 'Prof. Carlos Filipe', email: 'carlos@iscisa.ac.mz', status: 'active' }, joined_at: '2024-02-01' },
        { id: 5, user_id: 5, organ_id: 2, role: 'secretary', user: { id: 5, name: 'Pedro Secretário', email: 'pedro@iscisa.ac.mz', status: 'active' }, joined_at: '2024-03-10' },
        { id: 6, user_id: 6, organ_id: 2, role: 'member', user: { id: 6, name: 'Dr. Miguel Sousa', email: 'miguel@iscisa.ac.mz', status: 'inactive' }, joined_at: '2024-04-20' },
      ])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════════
  // CONVIDAR SECRETÁRIO/A
  // ═══════════════════════════════════════════════
  function openInviteSecretary() {
    setShowInviteSecretary(true)
    setSecretaryName('')
    setSecretaryEmail('')
    setSecretaryOffice('')
  }

  async function handleInviteSecretary(e: React.FormEvent) {
    e.preventDefault()
    if (!secretaryName || !secretaryEmail) return
    setIsSubmitting(true)
    setError(null)
    try {
      // 🟢 CORRIGIDO: removido 'office' (não existe no createSecretary)
      // 🟢 CORRIGIDO: removido 'organ_id' (backend impõe o órgão do executivo autenticado)
      await generalAdminService.createSecretary({
        name: secretaryName,
        email: secretaryEmail,
        scientific_area_id: null,
      })
      setSuccessMessage('Secretário/a convidado/a com sucesso! Email enviado.')
      setShowInviteSecretary(false)
      loadMembers()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e: any) {
      setError(e?.message || 'Erro ao convidar secretário/a.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ═══════════════════════════════════════════════
  // EDITAR / REMOVER
  // ═══════════════════════════════════════════════
  async function handleUpdateRole(memberId: number) {
    try {
      // 🟢 AINDA NÃO EXISTE NO BACKEND
      await organPresidentService.updateMemberRole(memberId, editingRole)
      setSuccessMessage('Função atualizada!')
      setEditingMemberId(null)
      loadMembers()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function handleRemoveMember(memberId: number) {
    if (!window.confirm('Tem certeza que deseja remover este membro?')) return
    try {
      // 🟢 AINDA NÃO EXISTE NO BACKEND
      await organPresidentService.removeMember(memberId)
      setSuccessMessage('Membro removido!')
      loadMembers()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const filteredMembers = members.filter(m => {
    const matchesSearch = !searchTerm || 
      m.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || m.role === filterRole
    return matchesSearch && matchesRole
  })

  if (loading) return <Loader />

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>Membros do Órgão</h1>
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>Gira os membros do {config.label}</p>
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
          {config.memberRoles.map(role => (<option key={role} value={role}>{ROLE_LABELS[role] || role}</option>))}
        </select>
        
        {/* Convidar Secretário/a */}
        <button onClick={openInviteSecretary} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '10px 16px',
          background: 'var(--primary)', color: 'var(--on-primary)', border: 'none',
          borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontSize: 'var(--body-md)',
          fontWeight: 'var(--font-semibold)', fontFamily: 'var(--font-family)', whiteSpace: 'nowrap'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>mail</span>
          Convidar Secretário/a
        </button>
      </div>

      {/* ═══════════════ MODAL: CONVIDAR SECRETÁRIO/A ═══════════════ */}
      {showInviteSecretary && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3)' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>mail</span>
              Convidar Secretário/a
            </h2>
            <form onSubmit={handleInviteSecretary} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <FormField label="Nome *" value={secretaryName} onChange={setSecretaryName} required />
              <FormField label="Email *" value={secretaryEmail} onChange={setSecretaryEmail} type="email" required />
              {/* 🟢 CORRIGIDO: removido campo Gabinete (não existe no createSecretary) */}
              <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', background: 'var(--tertiary-container)', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', margin: 0 }}>
                📧 Um email será enviado com um link para definir a senha. O órgão será automaticamente atribuído.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowInviteSecretary(false)} className="btn">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'A enviar...' : 'Enviar Convite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ LISTA DE MEMBROS ═══════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {filteredMembers.length === 0 ? (
          <EmptyState message="Nenhum membro encontrado" />
        ) : (
          filteredMembers.map(member => (
            <div key={member.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--font-bold)', flexShrink: 0 }}>
                  {member.user?.name?.charAt(0) || '?'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <h3 style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0 }}>{member.user?.name}</h3>
                    <span style={{ fontSize: 'var(--label-sm)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: ROLE_COLORS[member.role] || 'var(--surface-container)', color: member.role === 'member' ? 'var(--on-surface-variant)' : 'white', fontWeight: 'var(--font-medium)' }}>
                      {ROLE_LABELS[member.role] || member.role}
                    </span>
                    {member.user?.status === 'inactive' && (
                      <span style={{ fontSize: 'var(--label-sm)', background: 'var(--error-container)', color: 'var(--on-error-container)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>Inativo/a</span>
                    )}
                  </div>
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>{member.user?.email}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {editingMemberId === member.id ? (
                  <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                    <select value={editingRole} onChange={e => setEditingRole(e.target.value)} style={{ padding: '6px 10px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', fontSize: 'var(--label-sm)' }}>
                      {config.memberRoles.map(role => (<option key={role} value={role}>{ROLE_LABELS[role] || role}</option>))}
                    </select>
                    <button onClick={() => handleUpdateRole(member.id)} style={{ padding: '6px 10px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontSize: 'var(--label-sm)' }}>Salvar</button>
                    <button onClick={() => setEditingMemberId(null)} style={{ padding: '6px 10px', background: 'var(--surface-container)', border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontSize: 'var(--label-sm)' }}>Cancelar</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => { setEditingMemberId(member.id); setEditingRole(member.role) }} style={{ padding: '6px 12px', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontSize: 'var(--label-sm)', fontFamily: 'var(--font-family)' }}>Alterar função</button>
                    <button onClick={() => handleRemoveMember(member.id)} style={{ padding: '6px 12px', background: 'var(--error-container)', color: 'var(--on-error-container)', border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontSize: 'var(--label-sm)', fontFamily: 'var(--font-family)' }}>Remover</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════
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