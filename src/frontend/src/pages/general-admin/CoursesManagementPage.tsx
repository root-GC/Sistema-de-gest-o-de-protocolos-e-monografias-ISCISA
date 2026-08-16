// src/pages/general-admin/CoursesManagementPage.tsx
import { useEffect, useState } from 'react'
import { generalAdminService, type Course, type ScientificArea, type Organ } from '../../services/generalAdminService'
import '../../styles/global.css'

type TabType = 'courses' | 'areas'

const ORGAN_TYPE_LABELS: Record<string, string> = {
  nucleus: 'Núcleo Científico',
  scientific_committee: 'Comité Científico',
  bioethics_committee: 'Comité de Bioética',
  scientific_direction: 'Direção Científica',
}

export default function CoursesManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('courses')
  const [courses, setCourses] = useState<Course[]>([])
  const [areas, setAreas] = useState<ScientificArea[]>([])
  const [organs, setOrgans] = useState<Organ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formOrganId, setFormOrganId] = useState<number | null>(null)
  const [formAreaId, setFormAreaId] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [activeTab])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [coursesResponse, areasResponse, organsResponse] = await Promise.all([
        generalAdminService.listAllCourses(),
        generalAdminService.listAllAreas(),
        generalAdminService.listOrgans(),
      ])
      
      // Extrair cursos (lidar com paginação)
      const coursesRaw = (coursesResponse as any)?.data ?? coursesResponse
      const coursesArray = Array.isArray(coursesRaw) 
        ? coursesRaw 
        : (Array.isArray(coursesRaw?.data) ? coursesRaw.data : [])
      
      // Extrair áreas (lidar com paginação)
      const areasRaw = (areasResponse as any)?.data ?? areasResponse
      const areasArray = Array.isArray(areasRaw) 
        ? areasRaw 
        : (Array.isArray(areasRaw?.data) ? areasRaw.data : [])
      
      // Extrair órgãos
      const organsRaw = (organsResponse as any)?.data ?? organsResponse
      const organsArray = Array.isArray(organsRaw) 
        ? organsRaw 
        : (Array.isArray(organsRaw?.data) ? organsRaw.data : [])
      
      setCourses(Array.isArray(coursesArray) ? coursesArray : [])
      setAreas(Array.isArray(areasArray) ? areasArray : [])
      setOrgans(Array.isArray(organsArray) ? organsArray : [])
      
      console.log('Cursos carregados:', coursesArray)
      console.log('Áreas carregadas:', areasArray)
      console.log('Órgãos carregados:', organsArray)
    } catch (e) {
      console.error('Erro ao carregar dados:', e)
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function openCreateForm() {
    setEditingId(null)
    setFormName('')
    setFormCode('')
    setFormDescription('')
    setFormOrganId(null)
    setFormAreaId(null)
    setShowForm(true)
  }

  function openEditCourse(course: Course) {
    setEditingId(course.id)
    setFormName(course.name)
    setFormCode(course.code)
    setFormDescription(course.description || '')
    setFormAreaId(course.scientific_area_id)
    setShowForm(true)
  }

  function openEditArea(area: ScientificArea) {
    setEditingId(area.id)
    setFormName(area.name)
    setFormDescription(area.description || '')
    setFormOrganId(area.organ_id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      if (activeTab === 'courses') {
        if (editingId) {
          await generalAdminService.updateCourse(editingId, {
            name: formName,
            code: formCode,
            scientific_area_id: formAreaId!,
            description: formDescription || undefined,
          })
          setSuccessMessage('Curso atualizado!')
        } else {
          await generalAdminService.createCourse({
            name: formName,
            code: formCode,
            scientific_area_id: formAreaId!,
            description: formDescription || undefined,
          })
          setSuccessMessage('Curso criado!')
        }
      } else if (activeTab === 'areas') {
        if (editingId) {
          await generalAdminService.updateArea(editingId, {
            name: formName,
            organ_id: formOrganId!,
            description: formDescription || undefined,
          })
          setSuccessMessage('Área atualizada!')
        } else {
          await generalAdminService.createArea({
            name: formName,
            organ_id: formOrganId!,
            description: formDescription || undefined,
          })
          setSuccessMessage('Área criada!')
        }
      }
      setShowForm(false)
      await loadData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Tem certeza que deseja eliminar? Esta ação pode afetar dados associados.')) return
    try {
      if (activeTab === 'courses') {
        await generalAdminService.deleteCourse(id)
      } else {
        await generalAdminService.deleteArea(id)
      }
      setSuccessMessage('Eliminado com sucesso!')
      await loadData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  // Filtros
  const filteredCourses = courses.filter(c => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      c.name.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term) ||
      c.scientific_area?.name?.toLowerCase().includes(term)
    )
  })

  const filteredAreas = areas.filter(a => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      a.name.toLowerCase().includes(term) ||
      a.organ?.name?.toLowerCase().includes(term)
    )
  })

  // Agrupar cursos por área científica
  const coursesByArea = filteredCourses.reduce((acc, course) => {
    const areaName = course.scientific_area?.name || 'Sem área'
    if (!acc[areaName]) acc[areaName] = []
    acc[areaName].push(course)
    return acc
  }, {} as Record<string, Course[]>)

  if (loading) return <Loader />

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>Gestão de Cursos e Áreas</h1>
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>Administre cursos, áreas científicas e a sua organização</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {successMessage && <Alert type="success">{successMessage}</Alert>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '2px solid var(--outline-variant)', marginBottom: 'var(--space-4)' }}>
        {[
          { id: 'courses' as TabType, label: 'Cursos', icon: 'school', count: courses.length },
          { id: 'areas' as TabType, label: 'Áreas Científicas', icon: 'science', count: areas.length },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchTerm('') }} style={{
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

      {/* Barra de Pesquisa + Botão Criar */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '20px', pointerEvents: 'none' }}>search</span>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={`Pesquisar ${activeTab === 'courses' ? 'cursos' : 'áreas'}...`} style={{ width: '100%', padding: '10px 16px 10px 44px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <button onClick={openCreateForm} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '10px 16px',
          background: 'var(--primary)', color: 'var(--on-primary)', border: 'none',
          borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontSize: 'var(--body-md)',
          fontWeight: 'var(--font-semibold)', fontFamily: 'var(--font-family)', whiteSpace: 'nowrap'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          Novo{activeTab === 'courses' ? ' Curso' : 'a Área'}
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3)' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', width: '100%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>
              {editingId ? 'Editar' : 'Criar'} {activeTab === 'courses' ? 'Curso' : 'Área Científica'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              
              {activeTab === 'courses' && (
                <>
                  <FormSelect 
                    label="Área Científica" 
                    value={String(formAreaId || '')} 
                    onChange={v => setFormAreaId(v ? Number(v) : null)} 
                    options={areas.map(a => ({ value: String(a.id), label: a.name }))} 
                    required 
                  />
                  <FormField label="Nome do Curso" value={formName} onChange={setFormName} required />
                  <FormField label="Código" value={formCode} onChange={setFormCode} placeholder="Ex: MED, ENF" required />
                  <FormField label="Descrição" value={formDescription} onChange={setFormDescription} />
                </>
              )}

              {activeTab === 'areas' && (
                <>
                  <FormSelect 
                    label="Órgão" 
                    value={String(formOrganId || '')} 
                    onChange={v => setFormOrganId(v ? Number(v) : null)} 
                    options={organs.map(o => ({ value: String(o.id), label: `${o.name} (${ORGAN_TYPE_LABELS[o.type] || o.type})` }))} 
                    required 
                  />
                  <FormField label="Nome da Área" value={formName} onChange={setFormName} required />
                  <FormField label="Descrição" value={formDescription} onChange={setFormDescription} />
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

      {/* Lista de Cursos (agrupados por área) */}
      {activeTab === 'courses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {Object.keys(coursesByArea).length === 0 ? (
            <EmptyState message="Nenhum curso encontrado" />
          ) : (
            Object.entries(coursesByArea).map(([areaName, areaCourses]) => (
              <div key={areaName}>
                <h3 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>science</span>
                  {areaName}
                  <span style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', fontWeight: 'var(--font-regular)' }}>
                    ({areaCourses.length} curso{areaCourses.length !== 1 ? 's' : ''})
                  </span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {areaCourses.map(course => (
                    <div key={course.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span style={{ fontSize: 'var(--label-sm)', fontWeight: 'var(--font-bold)', background: 'var(--primary-container)', color: 'var(--on-primary-container)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontFamily: 'monospace' }}>
                            {course.code}
                          </span>
                          <h4 style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0 }}>{course.name}</h4>
                        </div>
                        {course.description && (
                          <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '4px 0 0' }}>{course.description}</p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <IconButton icon="edit" onClick={() => openEditCourse(course)} />
                        <IconButton icon="delete" color="var(--error)" onClick={() => handleDelete(course.id)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Lista de Áreas Científicas */}
      {activeTab === 'areas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {filteredAreas.length === 0 ? (
            <EmptyState message="Nenhuma área científica encontrada" />
          ) : (
            filteredAreas.map(area => (
              <div key={area.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: '20px' }}>science</span>
                    <h4 style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0 }}>{area.name}</h4>
                  </div>
                  {area.organ && (
                    <span style={{ fontSize: 'var(--label-sm)', color: 'var(--primary)', background: 'var(--primary-container)', padding: '2px 8px', borderRadius: 'var(--radius-full)', marginTop: '4px', display: 'inline-block' }}>
                      {area.organ.name}
                    </span>
                  )}
                  {area.description && (
                    <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '4px 0 0' }}>{area.description}</p>
                  )}
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>
                    {courses.filter(c => c.scientific_area_id === area.id).length} curso{courses.filter(c => c.scientific_area_id === area.id).length !== 1 ? 's' : ''} associado{courses.filter(c => c.scientific_area_id === area.id).length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <IconButton icon="edit" onClick={() => openEditArea(area)} />
                  <IconButton icon="delete" color="var(--error)" onClick={() => handleDelete(area.id)} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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

function FormField({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} style={{ padding: '10px 14px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none' }} />
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