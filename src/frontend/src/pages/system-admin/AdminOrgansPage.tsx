// src/pages/system-admin/AdminOrgansPage.tsx
import { useEffect, useState } from 'react'
import { adminService, type Organ, type ScientificArea, type Course } from '../../services/adminService'
import '../../styles/global.css'

type TabType = 'organs' | 'areas' | 'courses'

const ORGAN_TYPE_LABELS: Record<string, string> = {
  nucleus: 'Núcleo Científico',
  scientific_committee: 'Comité Científico',
  bioethics_committee: 'Comité de Bioética',
  scientific_direction: 'Direção Científica',
}

const ORGAN_TYPE_COLORS: Record<string, string> = {
  nucleus: 'var(--primary)',
  scientific_committee: 'var(--tertiary)',
  bioethics_committee: 'var(--secondary)',
  scientific_direction: 'var(--error)',
}

export default function AdminOrgansPage() {
  const [activeTab, setActiveTab] = useState<TabType>('organs')
  const [organs, setOrgans] = useState<Organ[]>([])
  const [areas, setAreas] = useState<ScientificArea[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('nucleus')
  const [formDescription, setFormDescription] = useState('')
  const [formOrganId, setFormOrganId] = useState<number | null>(null)
  const [formCode, setFormCode] = useState('')

  useEffect(() => {
    loadData()
  }, [activeTab])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      if (activeTab === 'organs') {
        const { data } = await adminService.listOrgans()
        setOrgans(data || [])
      } else if (activeTab === 'areas') {
        const { data } = await adminService.listScientificAreas()
        setAreas(data || [])
      } else if (activeTab === 'courses') {
        const { data } = await adminService.listCourses()
        setCourses(data || [])
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function openCreateForm() {
    setEditingId(null)
    setFormName('')
    setFormType('nucleus')
    setFormDescription('')
    setFormOrganId(null)
    setFormCode('')
    setShowForm(true)
  }

  function openEditOrgan(organ: Organ) {
    setEditingId(organ.id)
    setFormName(organ.name)
    setFormType(organ.type)
    setFormDescription(organ.description || '')
    setShowForm(true)
  }

  function openEditArea(area: ScientificArea) {
    setEditingId(area.id)
    setFormName(area.name)
    setFormOrganId(area.organ_id)
    setShowForm(true)
  }

  function openEditCourse(course: Course) {
    setEditingId(course.id)
    setFormName(course.name)
    setFormCode(course.code)
    setFormOrganId(course.scientific_area_id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      if (activeTab === 'organs') {
        if (editingId) {
          await adminService.updateOrgan(editingId, { name: formName, type: formType, description: formDescription })
          setSuccessMessage('Órgão atualizado!')
        } else {
          await adminService.createOrgan({ name: formName, type: formType, description: formDescription })
          setSuccessMessage('Órgão criado!')
        }
      } else if (activeTab === 'areas') {
        if (editingId) {
          await adminService.updateScientificArea(editingId, { name: formName, organ_id: formOrganId! })
          setSuccessMessage('Área atualizada!')
        } else {
          await adminService.createScientificArea({ name: formName, organ_id: formOrganId! })
          setSuccessMessage('Área criada!')
        }
      } else if (activeTab === 'courses') {
        if (editingId) {
          await adminService.updateCourse(editingId, { name: formName, code: formCode, scientific_area_id: formOrganId! })
          setSuccessMessage('Curso atualizado!')
        } else {
          await adminService.createCourse({ name: formName, code: formCode, scientific_area_id: formOrganId! })
          setSuccessMessage('Curso criado!')
        }
      }
      setShowForm(false)
      loadData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Tem certeza que deseja eliminar?')) return
    try {
      if (activeTab === 'organs') await adminService.deleteOrgan(id)
      else if (activeTab === 'areas') await adminService.deleteScientificArea(id)
      else if (activeTab === 'courses') await adminService.deleteCourse(id)
      setSuccessMessage('Eliminado com sucesso!')
      loadData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (loading) return <Loader />

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>Administração de Órgãos</h1>
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>Gira órgãos, áreas científicas e cursos do sistema</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {successMessage && <Alert type="success">{successMessage}</Alert>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '2px solid var(--outline-variant)', marginBottom: 'var(--space-4)' }}>
        {[
          { id: 'organs' as TabType, label: 'Órgãos', icon: 'account_balance', count: organs.length },
          { id: 'areas' as TabType, label: 'Áreas Científicas', icon: 'science', count: areas.length },
          { id: 'courses' as TabType, label: 'Cursos', icon: 'school', count: courses.length },
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

      {/* Botão Criar */}
      <button onClick={openCreateForm} style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '10px 16px',
        background: 'var(--primary)', color: 'var(--on-primary)', border: 'none',
        borderRadius: 'var(--radius-lg)', cursor: 'pointer', marginBottom: 'var(--space-3)',
        fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', fontFamily: 'var(--font-family)'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
        Novo{activeTab === 'organs' ? ' Órgão' : activeTab === 'areas' ? 'a Área' : ' Curso'}
      </button>

      {/* Modal Form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3)' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>
              {editingId ? 'Editar' : 'Criar'} {activeTab === 'organs' ? 'Órgão' : activeTab === 'areas' ? 'Área Científica' : 'Curso'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {activeTab === 'organs' && (
                <>
                  <FormField label="Nome" value={formName} onChange={setFormName} required />
                  <FormSelect label="Tipo" value={formType} onChange={setFormType} options={Object.entries(ORGAN_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
                  <FormField label="Descrição" value={formDescription} onChange={setFormDescription} />
                </>
              )}
              {activeTab === 'areas' && (
                <>
                  <FormSelect label="Órgão" value={String(formOrganId || '')} onChange={v => setFormOrganId(Number(v))} options={organs.map(o => ({ value: String(o.id), label: o.name }))} required />
                  <FormField label="Nome" value={formName} onChange={setFormName} required />
                </>
              )}
              {activeTab === 'courses' && (
                <>
                  <FormSelect label="Área Científica" value={String(formOrganId || '')} onChange={v => setFormOrganId(Number(v))} options={areas.map(a => ({ value: String(a.id), label: a.name }))} required />
                  <FormField label="Nome" value={formName} onChange={setFormName} required />
                  <FormField label="Código" value={formCode} onChange={setFormCode} required />
                </>
              )}
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 16px', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontFamily: 'var(--font-family)' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 16px', background: 'var(--primary)', color: 'var(--on-primary)', border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontFamily: 'var(--font-family)' }}>{editingId ? 'Atualizar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {(activeTab === 'organs' ? organs : activeTab === 'areas' ? areas : courses).length === 0 ? (
          <EmptyState message={`Nenhum${activeTab === 'organs' ? ' órgão' : activeTab === 'areas' ? 'a área' : ' curso'} encontrado`} />
        ) : (
          (activeTab === 'organs' ? organs : activeTab === 'areas' ? areas : courses).map((item: any) => (
            <div key={item.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0 }}>
                  {item.code ? `${item.code} • ` : ''}{item.name}
                </h3>
                {activeTab === 'organs' && (
                  <span style={{ fontSize: 'var(--label-sm)', color: ORGAN_TYPE_COLORS[item.type] || 'var(--outline)', background: 'var(--surface-container)', padding: '2px 8px', borderRadius: 'var(--radius-full)', marginTop: '4px', display: 'inline-block' }}>
                    {ORGAN_TYPE_LABELS[item.type] || item.type}
                  </span>
                )}
                {item.description && <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '4px 0 0' }}>{item.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                <IconButton icon="edit" onClick={() => activeTab === 'organs' ? openEditOrgan(item) : activeTab === 'areas' ? openEditArea(item) : openEditCourse(item)} />
                <IconButton icon="delete" color="var(--error)" onClick={() => handleDelete(item.id)} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================
function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span style={{ width: '24px', height: '24px', border: '3px solid var(--outline-variant)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

function Alert({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <div style={{ padding: 'var(--space-2) var(--space-3)', marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: type === 'error' ? 'var(--error-container)' : 'var(--primary-container)', color: type === 'error' ? 'var(--on-error-container)' : 'var(--on-primary-container)', fontSize: 'var(--body-md)' }}>
      {children}
    </div>
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

function FormField({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} required={required} style={{ padding: '10px 14px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none' }} />
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
    <button onClick={onClick} style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--surface-container)', color: color || 'var(--on-surface-variant)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
    </button>
  )
}