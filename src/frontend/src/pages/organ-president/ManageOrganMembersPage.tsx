// src/pages/organ-president/ManageOrganMembersPage.tsx
import { useEffect, useState } from 'react'
import { organPresidentService, type OrganMember } from '../../services/organPresidentService'
import { getOrganConfig } from './organPresidentConfig'
import '../../styles/global.css'

const ROLE_LABELS: Record<string, string> = {
  president: 'Presidente',
  vice_president: 'Vice-Presidente',
  reviewer: 'Revisor',
  member: 'Membro',
  secretary: 'Secretário',
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

  // Form
  const [showAddForm, setShowAddForm] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: number; name: string; email: string; status: string }[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState('member')
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null)
  const [editingRole, setEditingRole] = useState('')

  const organType = 'scientific_committee' // Virá do contexto/rota
  const config = getOrganConfig(organType)

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    setLoading(true)
    try {
      // Mock data
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

  async function handleSearchUsers() {
    if (userSearch.length < 3) return
    try {
      // Mock
      setSearchResults([
        { id: 10, name: 'Dr. António Ribeiro', email: 'antonio@iscisa.ac.mz', status: 'active' },
        { id: 11, name: 'Dra. Sofia Martins', email: 'sofia@iscisa.ac.mz', status: 'active' },
      ])
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function handleAddMember() {
    if (!selectedUserId) return
    try {
      await organPresidentService.addMember({ user_id: selectedUserId, role: selectedRole })
      setSuccessMessage('Membro adicionado!')
      setShowAddForm(false)
      setSelectedUserId(null)
      setUserSearch('')
      loadMembers()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function handleUpdateRole(memberId: number) {
    try {
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
          {config.memberRoles.map(role => (
            <option key={role} value={role}>{ROLE_LABELS[role] || role}</option>
          ))}
        </select>
        <button onClick={() => setShowAddForm(true)} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '10px 16px',
          background: 'var(--primary)', color: 'var(--on-primary)', border: 'none',
          borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontSize: 'var(--body-md)',
          fontWeight: 'var(--font-semibold)', fontFamily: 'var(--font-family)', whiteSpace: 'nowrap'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
          Adicionar Membro
        </button>
      </div>

      {/* Modal Adicionar Membro */}
      {showAddForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3)' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>Adicionar Membro</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', display: 'block', marginBottom: 'var(--space-1)' }}>Pesquisar Utilizador</label>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Nome ou email..." style={{ flex: 1, padding: '10px 14px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', outline: 'none' }} />
                  <button onClick={handleSearchUsers} style={{ padding: '10px 16px', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', cursor: 'pointer' }}>Buscar</button>
                </div>
              </div>
              {searchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', maxHeight: '200px', overflow: 'auto' }}>
                  {searchResults.map(u => (
                    <div key={u.id} onClick={() => setSelectedUserId(u.id)} style={{
                      padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                      background: selectedUserId === u.id ? 'var(--primary-container)' : 'var(--surface-container-low)',
                      border: selectedUserId === u.id ? '1px solid var(--primary)' : '1px solid transparent'
                    }}>
                      <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0 }}>{u.name}</p>
                      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: 0 }}>{u.email}</p>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', display: 'block', marginBottom: 'var(--space-1)' }}>Função</label>
                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', outline: 'none' }}>
                  {config.memberRoles.filter(r => r !== 'president').map(role => (
                    <option key={role} value={role}>{ROLE_LABELS[role] || role}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowAddForm(false); setSelectedUserId(null); setUserSearch(''); setSearchResults([]) }} className="btn">Cancelar</button>
                <button onClick={handleAddMember} className="btn btn-primary" disabled={!selectedUserId}>Adicionar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Membros */}
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
                    <span style={{ 
                      fontSize: 'var(--label-sm)', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      background: ROLE_COLORS[member.role] || 'var(--surface-container)',
                      color: member.role === 'member' ? 'var(--on-surface-variant)' : 'white',
                      fontWeight: 'var(--font-medium)'
                    }}>
                      {ROLE_LABELS[member.role] || member.role}
                    </span>
                    {member.user?.status === 'inactive' && (
                      <span style={{ fontSize: 'var(--label-sm)', background: 'var(--error-container)', color: 'var(--on-error-container)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>Inativo</span>
                    )}
                  </div>
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>{member.user?.email}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {/* Editar função */}
                {editingMemberId === member.id ? (
                  <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                    <select value={editingRole} onChange={e => setEditingRole(e.target.value)} style={{ padding: '6px 10px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', fontSize: 'var(--label-sm)' }}>
                      {config.memberRoles.map(role => (
                        <option key={role} value={role}>{ROLE_LABELS[role] || role}</option>
                      ))}
                    </select>
                    <button onClick={() => handleUpdateRole(member.id)} style={{ padding: '6px 10px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontSize: 'var(--label-sm)' }}>Salvar</button>
                    <button onClick={() => setEditingMemberId(null)} style={{ padding: '6px 10px', background: 'var(--surface-container)', border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontSize: 'var(--label-sm)' }}>Cancelar</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => { setEditingMemberId(member.id); setEditingRole(member.role) }} style={{ padding: '6px 12px', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontSize: 'var(--label-sm)', fontFamily: 'var(--font-family)' }}>
                      Alterar função
                    </button>
                    <button onClick={() => handleRemoveMember(member.id)} style={{ padding: '6px 12px', background: 'var(--error-container)', color: 'var(--on-error-container)', border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontSize: 'var(--label-sm)', fontFamily: 'var(--font-family)' }}>
                      Remover
                    </button>
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