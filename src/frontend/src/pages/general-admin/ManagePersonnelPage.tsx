// src/pages/general-admin/ManagePersonnelPage.tsx
import { useEffect, useState } from 'react'
import { generalAdminService, type Coordinator, type Secretary, type OrganPresident, type User, type Organ, type ScientificArea, type Course } from '../../services/generalAdminService'
import '../../styles/global.css'

type TabType = 'coordinators' | 'secretaries' | 'presidents'

const ORGAN_TYPE_LABELS: Record<string, string> = {
  nucleus: 'Núcleo Científico',
  scientific_committee: 'Comité Científico',
  bioethics_committee: 'Comité de Bioética',
  scientific_direction: 'Direção Científica',
}

export default function ManagePersonnelPage() {
  const [activeTab, setActiveTab] = useState<TabType>('coordinators')
  const [coordinators, setCoordinators] = useState<Coordinator[]>([])
  const [secretaries, setSecretaries] = useState<Secretary[]>([])
  const [presidents, setPresidents] = useState<OrganPresident[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [organs, setOrgans] = useState<Organ[]>([])
  const [areas, setAreas] = useState<ScientificArea[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formUserId, setFormUserId] = useState<number | null>(null)
  const [formOrganId, setFormOrganId] = useState<number | null>(null)
  const [formAreaId, setFormAreaId] = useState<number | null>(null)
  const [formCourseId, setFormCourseId] = useState<number | null>(null)
  const [formOffice, setFormOffice] = useState('')
  const [userSearch, setUserSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [activeTab])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [usersData, organsData, areasData, coursesData] = await Promise.all([
        generalAdminService.listUsers(),
        generalAdminService.listOrgans(),
        generalAdminService.listAllAreas(),
        generalAdminService.listAllCourses(),
      ])
      setUsers(usersData.data || [])
      setOrgans(organsData.data || [])
      setAreas(areasData.data || [])
      setCourses(coursesData.data || [])

      if (activeTab === 'coordinators') {
        const { data } = await generalAdminService.listCoordinators()
        setCoordinators(data || [])
      } else if (activeTab === 'secretaries') {
        const { data } = await generalAdminService.listSecretaries()
        setSecretaries(data || [])
      } else if (activeTab === 'presidents') {
        const { data } = await generalAdminService.listOrganPresidents()
        setPresidents(data || [])
      }
    } catch (e) {
      // Mock data
      setUsers([
        { id: 1, name: 'Maria Coordenadora', email: 'coord@iscisa.ac.mz', status: 'active', roles: [{ id: 3, name: 'coordinator' }] },
        { id: 2, name: 'Pedro Secretário', email: 'secretario@iscisa.ac.mz', status: 'active', roles: [{ id: 6, name: 'secretary' }] },
        { id: 3, name: 'João Docente', email: 'docente@iscisa.ac.mz', status: 'active', roles: [{ id: 2, name: 'teacher' }] },
      ])
      setOrgans([
        { id: 1, name: 'Núcleo Científico', type: 'nucleus' },
        { id: 2, name: 'Comité Científico', type: 'scientific_committee' },
        { id: 3, name: 'Comité de Bioética', type: 'bioethics_committee' },
      ])
      setCoordinators([{ id: 1, user_id: 1, user: { id: 1, name: 'Maria Coordenadora', email: 'coord@iscisa.ac.mz', status: 'active' }, scientific_area_id: 1, course_id: 1, course: { id: 1, name: 'Enfermagem', code: 'ENF' }, scientific_area: { id: 1, name: 'Enfermagem' }, office: 'Gabinete B', created_at: new Date().toISOString() }])
      setSecretaries([{ id: 1, user_id: 2, user: { id: 2, name: 'Pedro Secretário', email: 'secretario@iscisa.ac.mz', status: 'active' }, organ_id: 1, organ: { id: 1, name: 'Núcleo Científico', type: 'nucleus' }, office: 'Secretaria', created_at: new Date().toISOString() }])
      setPresidents([])
    } finally {
      setLoading(false)
    }
  }

  function openCreateForm() {
    setEditingId(null)
    setFormUserId(null)
    setFormOrganId(null)
    setFormAreaId(null)
    setFormCourseId(null)
    setFormOffice('')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      if (activeTab === 'coordinators') {
        await generalAdminService.createCoordinator({ user_id: formUserId!, scientific_area_id: formAreaId!, course_id: formCourseId!, office: formOffice })
        setSuccessMessage('Coordenador nomeado!')
      } else if (activeTab === 'secretaries') {
        await generalAdminService.createSecretary({ user_id: formUserId!, organ_id: formOrganId!, office: formOffice })
        setSuccessMessage('Secretário criado!')
      } else if (activeTab === 'presidents') {
        await generalAdminService.appointOrganPresident({ user_id: formUserId!, organ_id: formOrganId! })
        setSuccessMessage('Presidente nomeado!')
      }
      setShowForm(false)
      loadData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function handleRemove(id: number) {
    if (!window.confirm('Tem certeza que deseja remover?')) return
    try {
      if (activeTab === 'coordinators') await generalAdminService.removeCoordinator(id)
      else if (activeTab === 'secretaries') await generalAdminService.removeSecretary(id)
      else if (activeTab === 'presidents') await generalAdminService.removeOrganPresident(id)
      setSuccessMessage('Removido com sucesso!')
      loadData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true
    const term = userSearch.toLowerCase()
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
  })

  if (loading) return <Loader />

  const tabLabel = activeTab === 'coordinators' ? 'Coordenador' : activeTab === 'secretaries' ? 'Secretário' : 'Presidente de Órgão'

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>Gestão de Pessoal</h1>
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>Nomeie coordenadores, secretários e presidentes de órgãos</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {successMessage && <Alert type="success">{successMessage}</Alert>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '2px solid var(--outline-variant)', marginBottom: 'var(--space-4)' }}>
        {[
          { id: 'coordinators' as TabType, label: 'Coordenadores', icon: 'person_check', count: coordinators.length },
          { id: 'secretaries' as TabType, label: 'Secretários', icon: 'assignment', count: secretaries.length },
          { id: 'presidents' as TabType, label: 'Presidentes', icon: 'shield', count: presidents.length },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '12px var(--space-3)', fontSize: 'var(--body-md)',
            fontWeight: activeTab === tab.id ? 'var(--font-bold)' : 'var(--font-medium)',
            border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
            background: 'transparent', cursor: 'pointer',
            color: activeTab === tab.id ? 'var(--primary)' : 'var(--on-surface-variant)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{tab.icon}</span>
            {tab.label}
            <span style={{ background: 'var(--surface-container)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--label-sm)' }}>{tab.count}</span>
          </button>
        ))}
      </div>

      <button onClick={openCreateForm} style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '10px 16px',
        background: 'var(--primary)', color: 'var(--on-primary)', border: 'none',
        borderRadius: 'var(--radius-lg)', cursor: 'pointer', marginBottom: 'var(--space-3)',
        fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', fontFamily: 'var(--font-family)'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
        Nomear {tabLabel}
      </button>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3)' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', width: '100%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>Nomear {tabLabel}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              
              {/* Selecionar Utilizador */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)' }}>Utilizador</label>
                <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Pesquisar utilizador..." style={{ padding: '10px 14px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', outline: 'none' }} />
                <select value={String(formUserId || '')} onChange={e => setFormUserId(Number(e.target.value))} required style={{ padding: '10px 14px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', outline: 'none' }}>
                  <option value="">Selecione...</option>
                  {filteredUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              {/* Órgão (para secretários e presidentes) */}
              {(activeTab === 'secretaries' || activeTab === 'presidents') && (
                <FormSelect label="Órgão" value={String(formOrganId || '')} onChange={v => setFormOrganId(Number(v))} options={organs.map(o => ({ value: String(o.id), label: `${o.name} (${ORGAN_TYPE_LABELS[o.type] || o.type})` }))} required />
              )}

              {/* Área Científica e Curso (para coordenadores) */}
              {activeTab === 'coordinators' && (
                <>
                  <FormSelect label="Área Científica" value={String(formAreaId || '')} onChange={v => setFormAreaId(Number(v))} options={areas.map(a => ({ value: String(a.id), label: a.name }))} required />
                  <FormSelect label="Curso" value={String(formCourseId || '')} onChange={v => setFormCourseId(Number(v))} options={courses.filter(c => c.scientific_area_id === formAreaId).map(c => ({ value: String(c.id), label: `${c.code} - ${c.name}` }))} required />
                  <FormField label="Gabinete" value={formOffice} onChange={setFormOffice} />
                </>
              )}

              {/* Gabinete (para secretários) */}
              {activeTab === 'secretaries' && (
                <FormField label="Gabinete / Secretaria" value={formOffice} onChange={setFormOffice} />
              )}

              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn">Cancelar</button>
                <button type="submit" className="btn btn-primary">Nomear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {(activeTab === 'coordinators' ? coordinators : activeTab === 'secretaries' ? secretaries : presidents).map((item: any) => (
          <div key={item.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--font-bold)', flexShrink: 0 }}>
                {item.user?.name?.charAt(0) || '?'}
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0 }}>{item.user?.name}</h3>
                <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>{item.user?.email}</p>
                {activeTab === 'coordinators' && item.course && (
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--primary)', margin: '2px 0 0' }}>Curso: {item.course.name} • Área: {item.scientific_area?.name}</p>
                )}
                {(activeTab === 'secretaries' || activeTab === 'presidents') && item.organ && (
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--primary)', margin: '2px 0 0' }}>Órgão: {item.organ.name}</p>
                )}
              </div>
            </div>
            <button onClick={() => handleRemove(item.id)} style={{ background: 'var(--error-container)', color: 'var(--on-error-container)', border: 'none', padding: '8px 16px', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontFamily: 'var(--font-family)' }}>
              Remover
            </button>
          </div>
        ))}
        {((activeTab === 'coordinators' ? coordinators : activeTab === 'secretaries' ? secretaries : presidents).length === 0) && (
          <EmptyState message={`Nenhum ${tabLabel.toLowerCase()} nomeado`} />
        )}
      </div>
    </div>
  )
}

// Componentes auxiliares (reutilizados)
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
      <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>folder_open</span>
      <p>{message}</p>
    </div>
  )
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  required?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)' }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        style={{ padding: '10px 14px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', outline: 'none' }}
      >
        <option value="">Selecione...</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  )
}

function FormField({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)' }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        style={{ padding: '10px 14px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', outline: 'none' }}
      />
    </div>
  )
}