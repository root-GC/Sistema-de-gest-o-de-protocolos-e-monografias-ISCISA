// src/pages/system-admin/AdminUsersPage.tsx
import { useEffect, useState } from 'react'
import { adminService, type User, type Role, type Permission, type Organ } from '../../services/adminService'
import '../../styles/global.css'

type TabType = 'users' | 'roles' | 'permissions'

const DOMAIN_LABELS: Record<string, string> = {
  topic: 'Tema', protocol: 'Protocolo', document: 'Documentos',
  evaluation: 'Avaliação', supervision: 'Supervisão', reviewer: 'Revisor',
  workload: 'Carga de Trabalho', defense: 'Defesa', monograph: 'Monografia',
  reports: 'Relatórios', admin: 'Administração',
}

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('users')
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [organs, setOrgans] = useState<Organ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formStatus, setFormStatus] = useState('active')
  const [formOrganId, setFormOrganId] = useState<number | null>(null)
  const [formDescription, setFormDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null)

  useEffect(() => { 
    loadData()
    if (activeTab === 'users') loadOrgans() 
  }, [activeTab])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      if (activeTab === 'users') { 
        const response: any = await adminService.listUsers({ role: 'admin' })
        const data = Array.isArray(response) ? response : response?.data || []
        setUsers(Array.isArray(data) ? data : [])
      }
      else if (activeTab === 'roles') { 
        const response: any = await adminService.listRoles()
        const data = Array.isArray(response) ? response : response?.data || []
        setRoles(Array.isArray(data) ? data : [])
      }
      else if (activeTab === 'permissions') { 
        const response: any = await adminService.listPermissions()
        const data = Array.isArray(response) ? response : response?.data || []
        setPermissions(Array.isArray(data) ? data : [])
      }
    } catch (e) { 
      setError((e as Error).message) 
    } finally { 
      setLoading(false) 
    }
  }

  async function loadOrgans() {
    try {
      const response: any = await adminService.listOrgans()
      const data = Array.isArray(response) ? response : response?.data || []
      const filtered = (Array.isArray(data) ? data : []).filter((o: Organ) => o.type === 'scientific_direction')
      setOrgans(filtered)
      if (filtered.length === 1 && !editingId) setFormOrganId(filtered[0].id)
    } catch { /* silencioso */ }
  }

  function openCreateUser() {
    setEditingId(null)
    setFormName('')
    setFormEmail('')
    setFormStatus('active')
    setFormOrganId(organs.length === 1 ? organs[0].id : null)
    setShowForm(true)
  }

  function openEditUser(user: User) {
    setEditingId(user.id)
    setFormName(user.name)
    setFormEmail(user.email)
    setFormStatus(user.status)
    setFormOrganId((user.profiles?.admin as any)?.organ_id || null)
    setShowForm(true)
  }

  async function handleUserSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formOrganId || formOrganId === 0) {
      setError('Selecione um órgão (Direção Científica).')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      if (editingId) {
        await adminService.updateUser(editingId, {
          name: formName,
          email: formEmail,
          status: formStatus,
          organ_id: formOrganId
        })
        setSuccessMessage('Administrador/a atualizado/a com sucesso!')
      } else {
        await adminService.createUser({
          name: formName,
          email: formEmail,
          organ_id: formOrganId
        })
        setSuccessMessage('Administrador/a criado/a e convite enviado com sucesso!')
      }
      setShowForm(false)
      loadData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e: any) {
      setError(e?.message || 'Erro ao processar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleStatus(user: User) {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    setTogglingUserId(user.id)
    try {
      await adminService.updateUser(user.id, { status: newStatus })
      setSuccessMessage(`Administrador/a ${newStatus === 'active' ? 'ativado/a' : 'desativado/a'} com sucesso!`)
      await loadData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e: any) {
      setError(e?.message || 'Erro ao alterar estado do/a administrador/a.')
      setTimeout(() => setError(null), 4000)
    } finally {
      setTogglingUserId(null)
    }
  }

  async function handleDeleteUser(id: number) {
    if (!window.confirm('Tem certeza que deseja eliminar este/a administrador/a?')) return
    try {
      await adminService.deleteUser(id)
      setSuccessMessage('Administrador/a eliminado/a com sucesso!')
      loadData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function openCreateRole() {
    setEditingId(null)
    setFormName('')
    setFormDescription('')
    setSelectedPermissions([])
    setShowForm(true)
  }

  function openEditRole(role: Role) {
    setEditingId(role.id)
    setFormName(role.name)
    setFormDescription(role.description)
    setSelectedPermissions(role.permissions?.map(p => p.code) || [])
    setShowForm(true)
  }

  async function handleRoleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      if (editingId) {
        await adminService.updateRole(editingId, { name: formName, description: formDescription, permissions: selectedPermissions })
        setSuccessMessage('Role atualizada com sucesso!')
      } else {
        await adminService.createRole({ name: formName, description: formDescription, permissions: selectedPermissions })
        setSuccessMessage('Role criada com sucesso!')
      }
      setShowForm(false)
      loadData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteRole(id: number) {
    if (!window.confirm('Eliminar esta role?')) return
    try {
      await adminService.deleteRole(id)
      setSuccessMessage('Role eliminada!')
      loadData()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function togglePermission(code: string) {
    setSelectedPermissions(prev =>
      prev.includes(code) ? prev.filter(p => p !== code) : [...prev, code]
    )
  }

  // Garantir arrays
  const safePermissions = Array.isArray(permissions) ? permissions : []
  const safeUsers = Array.isArray(users) ? users : []
  const safeRoles = Array.isArray(roles) ? roles : []
  const safeOrgans = Array.isArray(organs) ? organs : []

  const permissionGroups = safePermissions.reduce((acc, p) => {
    const d = p.domain || p.code.split('.')[0]
    if (!acc[d]) acc[d] = []
    acc[d].push(p)
    return acc
  }, {} as Record<string, Permission[]>)

  const filteredUsers = safeUsers.filter(u => {
    if (!searchTerm) return true
    const t = searchTerm.toLowerCase()
    return u.name.toLowerCase().includes(t) || u.email.toLowerCase().includes(t)
  })

  const tabs = [
    { id: 'users' as TabType, label: 'Administradores/as', icon: 'shield_person', count: safeUsers.length },
    { id: 'roles' as TabType, label: 'Roles', icon: 'shield', count: safeRoles.length },
    { id: 'permissions' as TabType, label: 'Permissões', icon: 'key', count: safePermissions.length },
  ]

  if (loading) return <Loader />

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>
          Administração do Sistema
        </h1>
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
          Gira administradores/as, roles e permissões do sistema
        </p>
      </div>

      {error && <Alert type="error" onClose={() => setError(null)}>{error}</Alert>}
      {successMessage && <Alert type="success" onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '2px solid var(--outline-variant)', marginBottom: 'var(--space-4)' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '12px var(--space-3)', fontSize: 'var(--body-md)',
            fontWeight: activeTab === tab.id ? 'var(--font-bold)' : 'var(--font-medium)',
            border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
            background: 'transparent', cursor: 'pointer', transition: 'all 0.2s',
            color: activeTab === tab.id ? 'var(--primary)' : 'var(--on-surface-variant)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{tab.icon}</span>
            {tab.label}
            <span style={{ background: 'var(--surface-container)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--label-sm)' }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Toolbar - Users */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '20px', pointerEvents: 'none' }}>search</span>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar administradores/as..." style={{ width: '100%', padding: '10px 16px 10px 44px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button onClick={openCreateUser} disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '10px 16px', background: 'var(--primary)', color: 'var(--on-primary)', border: 'none', borderRadius: 'var(--radius-lg)', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', fontFamily: 'var(--font-family)', whiteSpace: 'nowrap', opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
            Convidar Admin
          </button>
        </div>
      )}

      {/* Toolbar - Roles */}
      {activeTab === 'roles' && (
        <button onClick={openCreateRole} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '10px 16px', background: 'var(--primary)', color: 'var(--on-primary)', border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', marginBottom: 'var(--space-3)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', fontFamily: 'var(--font-family)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          Nova Role
        </button>
      )}

      {/* Users List */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {filteredUsers.length === 0 ? (
            <EmptyState message="Nenhum/a administrador/a encontrado/a" />
          ) : (
            filteredUsers.map(user => (
              <div key={user.id} className="card suave-card" style={{ 
                padding: 'var(--space-3) var(--space-4)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                gap: 'var(--space-3)', 
                flexWrap: 'wrap',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: user.status === 'active' ? 'var(--primary-container)' : 'var(--surface-container-high)', 
                    color: user.status === 'active' ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 'var(--font-bold)',
                    flexShrink: 0,
                    transition: 'all 0.3s ease'
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0 }}>
                      {user.name}
                      {user.status === 'inactive' && (
                        <span style={{ 
                          marginLeft: '8px',
                          fontSize: 'var(--label-sm)',
                          color: 'var(--error)',
                          background: 'var(--error-container)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 'var(--font-medium)'
                        }}>
                          Inativo
                        </span>
                      )}
                    </h3>
                    <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>{user.email}</p>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 'var(--label-sm)', background: 'var(--primary-container)', padding: '2px 6px', borderRadius: 'var(--radius-full)', color: 'var(--on-primary-container)' }}>admin</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                  <ToggleSwitch
                    isActive={user.status === 'active'}
                    isLoading={togglingUserId === user.id}
                    onToggle={() => handleToggleStatus(user)}
                    size="md"
                    label={user.status === 'active' ? 'Desativar' : 'Ativar'}
                  />
                  <IconButton icon="edit" onClick={() => openEditUser(user)} />
                  <IconButton icon="delete" color="var(--error)" onClick={() => handleDeleteUser(user.id)} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Roles List */}
      {activeTab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {safeRoles.length === 0 ? (
            <EmptyState message="Nenhuma role encontrada" />
          ) : (
            safeRoles.map(role => (
              <div key={role.id} className="card suave-card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0, textTransform: 'capitalize' }}>{role.name}</h3>
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>{role.description}</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <IconButton icon="edit" onClick={() => openEditRole(role)} />
                  <IconButton icon="delete" color="var(--error)" onClick={() => handleDeleteRole(role.id)} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Permissions List */}
      {activeTab === 'permissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {Object.keys(permissionGroups).length === 0 ? (
            <EmptyState message="Nenhuma permissão encontrada" />
          ) : (
            Object.entries(permissionGroups).map(([domain, perms]) => (
              <div key={domain}>
                <h3 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)', color: 'var(--primary)', textTransform: 'capitalize' }}>{DOMAIN_LABELS[domain] || domain}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-2)' }}>
                  {(Array.isArray(perms) ? perms : []).map(p => (
                    <div key={p.id} className="card" style={{ padding: 'var(--space-2) var(--space-3)' }}>
                      <p style={{ fontSize: 'var(--body-sm)', fontWeight: 'var(--font-semibold)', margin: 0, fontFamily: 'monospace', color: 'var(--primary)' }}>{p.code}</p>
                      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3)' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', width: '100%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>
              {editingId ? 'Editar' : 'Convidar'} Administrador/a
            </h2>
            <form onSubmit={activeTab === 'users' ? handleUserSubmit : handleRoleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>

              {activeTab === 'users' && (
                <>
                  <FormField label="Nome" value={formName} onChange={setFormName} required />
                  <FormField label="Email" value={formEmail} onChange={setFormEmail} type="email" required />
                  {editingId && <FormSelect label="Estado" value={formStatus} onChange={setFormStatus} options={[{ value: 'active', label: 'Ativo/a' }, { value: 'inactive', label: 'Inativo/a' }]} />}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>Órgão (Direção Científica)</label>
                    <select value={formOrganId ?? ''} onChange={e => { const val = e.target.value; setFormOrganId(val === '' ? null : Number(val)) }} required style={{ padding: '10px 14px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none' }}>
                      <option value="">Selecione um órgão...</option>
                      {safeOrgans.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                  {!editingId && <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', background: 'var(--tertiary-container)', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)' }}>Um email será enviado com um link para definir a senha.</p>}
                </>
              )}

              {activeTab === 'roles' && (
                <>
                  <FormField label="Nome da Role" value={formName} onChange={setFormName} required />
                  <FormField label="Descrição" value={formDescription} onChange={setFormDescription} />
                  <div>
                    <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-2)', display: 'block' }}>Permissões</label>
                    {Object.entries(permissionGroups).map(([domain, perms]) => (
                      <div key={domain} style={{ marginBottom: 'var(--space-2)' }}>
                        <p style={{ fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--primary)', marginBottom: 'var(--space-1)', textTransform: 'capitalize' }}>{DOMAIN_LABELS[domain] || domain}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                          {(Array.isArray(perms) ? perms : []).map(p => (
                            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: selectedPermissions.includes(p.code) ? 'var(--primary-container)' : 'var(--surface-container)', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontSize: 'var(--label-sm)' }}>
                              <input type="checkbox" checked={selectedPermissions.includes(p.code)} onChange={() => togglePermission(p.code)} style={{ display: 'none' }} />
                              {p.code}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting && <span style={{ width: '16px', height: '16px', border: '2px solid var(--on-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                  {isSubmitting ? 'A processar...' : editingId ? 'Atualizar' : 'Convidar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════
// COMPONENTE TOGGLE SWITCH
// ═══════════════════════════════════════════════

interface ToggleSwitchProps {
  isActive: boolean;
  isLoading?: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  disabled?: boolean;
}

function ToggleSwitch({ 
  isActive, 
  isLoading = false, 
  onToggle, 
  size = 'md',
  label,
  disabled = false
}: ToggleSwitchProps) {
  const sizeMap = {
    sm: { switch: 32, knob: 20, fontSize: 12 },
    md: { switch: 40, knob: 26, fontSize: 14 },
    lg: { switch: 48, knob: 32, fontSize: 16 }
  }

  const sizes = sizeMap[size]
  const isDisabled = disabled || isLoading

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: isDisabled ? 0.6 : 1 }}>
      {label && <span style={{ fontSize: `${sizes.fontSize}px`, color: 'var(--on-surface-variant)', fontWeight: 'var(--font-medium)' }}>{label}</span>}
      <button
        type="button"
        onClick={onToggle}
        disabled={isDisabled}
        style={{
          position: 'relative',
          width: `${sizes.switch}px`,
          height: `${sizes.switch * 0.6}px`,
          borderRadius: 'var(--radius-full)',
          border: 'none',
          background: isActive ? 'var(--primary)' : 'var(--surface-container-high)',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isActive ? '0 0 0 4px var(--primary-container)' : 'none',
          flexShrink: 0,
          outline: 'none'
        }}
        aria-checked={isActive}
        role="switch"
      >
        <div style={{
          position: 'absolute',
          top: '50%',
          left: isActive ? 'auto' : `${(sizes.switch - sizes.knob) / 2}px`,
          right: isActive ? `${(sizes.switch - sizes.knob) / 2}px` : 'auto',
          transform: 'translateY(-50%)',
          width: `${sizes.knob}px`,
          height: `${sizes.knob}px`,
          borderRadius: '50%',
          background: 'var(--surface-container-lowest)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {isLoading ? (
            <div style={{ width: '12px', height: '12px', border: '2px solid var(--outline-variant)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          ) : isActive ? (
            <span className="material-symbols-outlined" style={{ fontSize: `${sizes.knob * 0.45}px`, color: 'var(--primary)', fontWeight: 'bold' }}>check</span>
          ) : null}
        </div>
      </button>
      <span style={{ fontSize: `${sizes.fontSize * 0.85}px`, fontWeight: 'var(--font-semibold)', color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)', minWidth: '50px' }}>
        {isActive ? 'Ativo' : 'Inativo'}
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════

function Loader() { 
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 'var(--space-2)' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--outline-variant)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)' }}>Carregando...</p>
    </div>
  )
}

function Alert({ type, children, onClose }: { type: 'error' | 'success'; children: React.ReactNode; onClose?: () => void }) { 
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: type === 'error' ? 'var(--error-container)' : 'var(--primary-container)', color: type === 'error' ? 'var(--on-error-container)' : 'var(--on-primary-container)', fontSize: 'var(--body-md)', border: `1px solid ${type === 'error' ? 'var(--error)' : 'var(--primary)'}` }}>
      <span>{children}</span>
      {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px', fontSize: '20px', opacity: 0.7 }}>✕</button>}
    </div>
  )
}

function EmptyState({ message }: { message: string }) { 
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-5)', color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--outline-variant)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>folder_open</span>
      <p style={{ fontSize: 'var(--body-md)' }}>{message}</p>
    </div>
  )
}

function FormField({ label, value, onChange, type = 'text', required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) { 
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} style={{ padding: '10px 14px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none' }} />
    </div>
  )
}

function FormSelect({ label, value, onChange, options, required }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; required?: boolean }) { 
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} required={required} style={{ padding: '10px 14px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none' }}>
        <option value="">Selecione...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function IconButton({ icon, color, onClick }: { icon: string; color?: string; onClick: () => void }) { 
  return (
    <button onClick={onClick} style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--surface-container)', color: color || 'var(--on-surface-variant)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.background = color ? 'var(--error-container)' : 'var(--surface-container-high)'; e.currentTarget.style.transform = 'scale(1.05)' }} 
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-container)'; e.currentTarget.style.transform = 'scale(1)' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
    </button>
  )
}