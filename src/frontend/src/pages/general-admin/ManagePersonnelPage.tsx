// src/pages/general-admin/ManagePersonnelPage.tsx
import { useEffect, useState } from 'react'
import { generalAdminService, type Coordinator, type Secretary, type Organ, type ScientificArea, type Course } from '../../services/generalAdminService'
import { adminService } from '../../services/adminService'
import { useAuth } from '../../context/AuthContext'
import '../../styles/global.css'

type TabType = 'coordinators' | 'secretaries'

export default function ManagePersonnelPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('coordinators')
  const [coordinators, setCoordinators] = useState<Coordinator[]>([])
  const [secretaries, setSecretaries] = useState<Secretary[]>([])
  const [organs, setOrgans] = useState<Organ[]>([])
  const [areas, setAreas] = useState<ScientificArea[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Órgão do admin autenticado
  const [adminOrganId, setAdminOrganId] = useState<number | null>(null)
  const [adminOrganName, setAdminOrganName] = useState<string>('Carregando...')

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formAreaId, setFormAreaId] = useState<number | null>(null)
  const [formCourseId, setFormCourseId] = useState<number | null>(null)
  const [formOffice, setFormOffice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadAdminOrgan()
    loadData()
  }, [activeTab])

  // ═══════════════════════════════════════════════
  // BUSCAR ÓRGÃO DO ADMIN AUTENTICADO
  // ═══════════════════════════════════════════════
  async function loadAdminOrgan() {
    try {
      const userId = (user as any)?.id
      if (!userId) {
        const organId = (user as any)?.profiles?.admin?.organ_id
        const organName = (user as any)?.profiles?.admin?.organ?.name
        if (organId) {
          setAdminOrganId(organId)
          setAdminOrganName(organName || `Órgão #${organId}`)
          return
        }
        setAdminOrganName('Não definido')
        return
      }

      const { data } = await adminService.getUser(userId)
      const adminProfile = (data as any)?.profiles?.admin || (data as any)?.adminProfile
      if (adminProfile?.organ_id) {
        setAdminOrganId(adminProfile.organ_id)
        setAdminOrganName(adminProfile.organ?.name || `Órgão #${adminProfile.organ_id}`)
      } else {
        setAdminOrganName('Não definido')
      }
    } catch {
      const organId = (user as any)?.profiles?.admin?.organ_id
      const organName = (user as any)?.profiles?.admin?.organ?.name
      if (organId) {
        setAdminOrganId(organId)
        setAdminOrganName(organName || `Órgão #${organId}`)
      } else {
        setAdminOrganName('Não definido')
      }
    }
  }

  // ═══════════════════════════════════════════════
  // CARREGAR DADOS
  // ═══════════════════════════════════════════════
  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [organsData, areasData, coursesData] = await Promise.all([
        generalAdminService.listOrgans(),
        generalAdminService.listAllAreas(),
        generalAdminService.listAllCourses(),
      ])
      setOrgans(Array.isArray(organsData.data) ? organsData.data : [])
      setAreas(Array.isArray(areasData.data) ? areasData.data : [])
      setCourses(Array.isArray(coursesData.data) ? coursesData.data : [])

      if (activeTab === 'coordinators') {
        try {
          const { data } = await generalAdminService.listCoordinators()
          setCoordinators(Array.isArray(data) ? data : [])
        } catch {
          setCoordinators([])
        }
      } else if (activeTab === 'secretaries') {
        try {
          const { data } = await generalAdminService.listSecretaries()
          setSecretaries(Array.isArray(data) ? data : [])
        } catch {
          setSecretaries([])
        }
      }
    } catch (e) {
      setError((e as Error).message)
      loadMockData()
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════════
  // MOCK DATA (FALLBACK)
  // ═══════════════════════════════════════════════
  function loadMockData() {
    setOrgans([
      { id: 1, name: 'Núcleo Científico', type: 'nucleus' },
      { id: 2, name: 'Comité Científico', type: 'scientific_committee' },
      { id: 3, name: 'Comité de Bioética', type: 'bioethics_committee' },
      { id: 4, name: 'Direção Científica', type: 'scientific_direction' },
    ])
    setAreas([
      { id: 1, organ_id: 1, name: 'Saúde Pública', organ: { id: 1, name: 'Núcleo Científico', type: 'nucleus' } },
      { id: 2, organ_id: 1, name: 'Enfermagem', organ: { id: 1, name: 'Núcleo Científico', type: 'nucleus' } },
      { id: 3, organ_id: 2, name: 'Medicina Interna', organ: { id: 2, name: 'Comité Científico', type: 'scientific_committee' } },
    ])
    setCourses([
      { id: 1, scientific_area_id: 1, name: 'Medicina', code: 'MED', scientific_area: { id: 1, name: 'Saúde Pública' } },
      { id: 2, scientific_area_id: 2, name: 'Enfermagem Geral', code: 'ENF', scientific_area: { id: 2, name: 'Enfermagem' } },
      { id: 3, scientific_area_id: 1, name: 'Farmácia', code: 'FAR', scientific_area: { id: 1, name: 'Saúde Pública' } },
    ])

    if (!adminOrganId) {
      setAdminOrganId(1)
      setAdminOrganName('Núcleo Científico')
    }

    if (activeTab === 'coordinators') {
      setCoordinators([
        { id: 1, user_id: 1, user: { id: 1, name: 'Maria Coordenadora', email: 'coord@iscisa.ac.mz', status: 'active' }, scientific_area_id: 1, course_id: 1, course: { id: 1, name: 'Medicina', code: 'MED' }, scientific_area: { id: 1, name: 'Saúde Pública' }, office: 'Gabinete B', created_at: new Date().toISOString() }
      ])
      setSecretaries([])
    } else if (activeTab === 'secretaries') {
      setSecretaries([
        { id: 1, user_id: 2, user: { id: 2, name: 'Pedro Secretário', email: 'secretario@iscisa.ac.mz', status: 'active' }, organ_id: adminOrganId || 1, organ: { id: adminOrganId || 1, name: adminOrganName, type: 'nucleus' }, office: 'Secretaria', created_at: new Date().toISOString() }
      ])
      setCoordinators([])
    }
  }

  // ═══════════════════════════════════════════════
  // ABRIR FORMULÁRIOS
  // ═══════════════════════════════════════════════
  function openCreateForm() {
    setEditingId(null)
    setFormName('')
    setFormEmail('')
    setFormAreaId(null)
    setFormCourseId(null)
    setFormOffice('')
    setShowForm(true)
  }

  function openEditCoordinator(coordinator: Coordinator) {
    setEditingId(coordinator.id)
    setFormName(coordinator.user?.name || '')
    setFormEmail(coordinator.user?.email || '')
    setFormAreaId(coordinator.scientific_area_id)
    setFormCourseId(coordinator.course_id)
    setFormOffice(coordinator.office || '')
    setShowForm(true)
  }

  function openEditSecretary(secretary: Secretary) {
    setEditingId(secretary.id)
    setFormName(secretary.user?.name || '')
    setFormEmail(secretary.user?.email || '')
    setFormAreaId(secretary.scientific_area_id || null)
    setFormOffice(secretary.office || '')
    setShowForm(true)
  }

  // ═══════════════════════════════════════════════
  // SUBMETER FORMULÁRIO
  // ═══════════════════════════════════════════════
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      if (activeTab === 'coordinators') {
        if (editingId) {
          await generalAdminService.updateCoordinator(editingId, {
            scientific_area_id: formAreaId!,
            course_id: formCourseId!,
            office: formOffice || undefined,
          })
          setSuccessMessage('Coordenador atualizado!')
        } else {
          await generalAdminService.createCoordinator({
            name: formName,
            email: formEmail,
            scientific_area_id: formAreaId!,
            course_id: formCourseId!,
            office: formOffice || undefined,
          })
          setSuccessMessage('Coordenador criado! Convite enviado.')
        }
      } else if (activeTab === 'secretaries') {
        if (editingId) {
          await generalAdminService.updateSecretary(editingId, {
            scientific_area_id: formAreaId || null,
            office: formOffice || undefined,
          })
          setSuccessMessage('Secretário atualizado!')
        } else {
          await generalAdminService.createSecretary({
            name: formName,
            email: formEmail,
            scientific_area_id: formAreaId || null,
            office: formOffice || undefined,
          })
          setSuccessMessage('Secretário criado! Convite enviado.')
        }
      }
      setShowForm(false)
      await loadData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ═══════════════════════════════════════════════
  // REMOVER
  // ═══════════════════════════════════════════════
  async function handleRemove(id: number) {
    if (!window.confirm('Tem certeza que deseja remover?')) return
    try {
      if (activeTab === 'coordinators') {
        await generalAdminService.removeCoordinator(id)
      } else if (activeTab === 'secretaries') {
        await generalAdminService.removeSecretary(id)
      }
      setSuccessMessage('Removido com sucesso!')
      await loadData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════
  if (loading) return <Loader />

  const tabLabel = activeTab === 'coordinators' ? 'Coordenador' : 'Secretário'

  const safeAreas = Array.isArray(areas) ? areas : []
  const safeCourses = Array.isArray(courses) ? courses : []

  const filteredCourses = formAreaId
    ? safeCourses.filter(c => c.scientific_area_id === formAreaId)
    : safeCourses

  const organAreas = adminOrganId
    ? safeAreas.filter(a => a.organ_id === adminOrganId)
    : safeAreas

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>
          Gestão de Pessoal
        </h1>
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
          Nomeie coordenadores e secretários
        </p>
      </div>

      {error && <Alert type="error" onClose={() => setError(null)}>{error}</Alert>}
      {successMessage && <Alert type="success" onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '2px solid var(--outline-variant)', marginBottom: 'var(--space-4)' }}>
        {[
          { id: 'coordinators' as TabType, label: 'Coordenadores', icon: 'person_check', count: coordinators.length },
          { id: 'secretaries' as TabType, label: 'Secretários', icon: 'assignment', count: secretaries.length },
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
      <button onClick={openCreateForm} disabled={isSubmitting} style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '10px 16px',
        background: 'var(--primary)', color: 'var(--on-primary)', border: 'none',
        borderRadius: 'var(--radius-lg)', cursor: isSubmitting ? 'not-allowed' : 'pointer', marginBottom: 'var(--space-3)',
        fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', fontFamily: 'var(--font-family)',
        opacity: isSubmitting ? 0.7 : 1
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
        {editingId ? 'Editar' : 'Nomear'} {tabLabel}
      </button>

      {/* ═══════════════ MODAL FORM ═══════════════ */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3)' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', width: '100%', maxWidth: '520px', maxHeight: '85vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>
              {editingId ? 'Editar' : 'Nomear'} {tabLabel}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>

              {/* ═══════ COORDENADORES ═══════ */}
              {activeTab === 'coordinators' && (
                <>
                  {!editingId && (
                    <>
                      <FormField label="Nome *" value={formName} onChange={setFormName} required />
                      <FormField label="Email *" value={formEmail} onChange={setFormEmail} type="email" required />
                    </>
                  )}
                  <FormSelect
                    label="Área Científica *"
                    value={String(formAreaId || '')}
                    onChange={v => {
                      setFormAreaId(v ? Number(v) : null)
                      setFormCourseId(null)
                    }}
                    options={safeAreas.map(a => ({ value: String(a.id), label: `${a.name} (${a.organ?.name || ''})` }))}
                    required
                  />
                  <FormSelect
                    label="Curso *"
                    value={String(formCourseId || '')}
                    onChange={v => setFormCourseId(v ? Number(v) : null)}
                    options={filteredCourses.map(c => ({ value: String(c.id), label: `${c.code} - ${c.name}` }))}
                    required
                    disabled={!formAreaId}
                    placeholder={!formAreaId ? 'Selecione uma área primeiro...' : 'Selecione um curso...'}
                  />
                  <FormField label="Gabinete" value={formOffice} onChange={setFormOffice} placeholder="Ex: Gabinete B" />
                  {!editingId && (
                    <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', background: 'var(--tertiary-container)', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', margin: 0 }}>
                      📧 Um email será enviado com um link para definir a senha.
                    </p>
                  )}
                </>
              )}

              {/* ═══════ SECRETÁRIOS ═══════ */}
              {activeTab === 'secretaries' && (
                <>
                  {!editingId && (
                    <>
                      <FormField label="Nome *" value={formName} onChange={setFormName} required />
                      <FormField label="Email *" value={formEmail} onChange={setFormEmail} type="email" required />
                    </>
                  )}

                  {/* Órgão fixo - informativo */}
                  <div style={{
                    padding: 'var(--space-3)',
                    background: adminOrganId ? 'var(--surface-container)' : 'var(--error-container)',
                    borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${adminOrganId ? 'var(--outline-variant)' : 'var(--error)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)'
                  }}>
                    <span className="material-symbols-outlined" style={{
                      color: adminOrganId ? 'var(--primary)' : 'var(--error)',
                      fontSize: '24px',
                      flexShrink: 0
                    }}>
                      account_balance
                    </span>
                    <div>
                      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: 0 }}>
                        Órgão
                      </p>
                      <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', color: adminOrganId ? 'var(--on-surface)' : 'var(--error)', margin: '2px 0 0' }}>
                        {adminOrganName}
                      </p>
                      {!adminOrganId && (
                        <p style={{ fontSize: 'var(--label-sm)', color: 'var(--error)', margin: '4px 0 0' }}>
                          ⚠️ O seu utilizador não está associado a nenhum órgão.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Área Científica - OPCIONAL */}
                  {organAreas.length > 0 ? (
                    <FormSelect
                      label="Área Científica (opcional)"
                      value={String(formAreaId || '')}
                      onChange={v => setFormAreaId(v ? Number(v) : null)}
                      options={[
                        { value: '', label: 'Nenhuma (todo o órgão)' },
                        ...organAreas.map(a => ({ value: String(a.id), label: a.name }))
                      ]}
                    />
                  ) : (
                    <div style={{
                      padding: 'var(--space-2)',
                      background: 'var(--surface-container)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--label-sm)',
                      color: 'var(--on-surface-variant)'
                    }}>
                      Nenhuma área científica disponível para este órgão.
                    </div>
                  )}

                  <FormField label="Gabinete / Secretaria" value={formOffice} onChange={setFormOffice} placeholder="Ex: Secretaria do Núcleo" />
                  {!editingId && (
                    <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', background: 'var(--tertiary-container)', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', margin: 0 }}>
                      📧 Um email será enviado com um link para definir a senha.
                    </p>
                  )}
                </>
              )}

              {/* Botões */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn" disabled={isSubmitting}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || (activeTab === 'secretaries' && !adminOrganId)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', opacity: (isSubmitting || (activeTab === 'secretaries' && !adminOrganId)) ? 0.7 : 1 }}>
                  {isSubmitting && <span style={{ width: '16px', height: '16px', border: '2px solid var(--on-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                  {isSubmitting ? 'A processar...' : editingId ? 'Atualizar' : 'Nomear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ LISTA ═══════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {(activeTab === 'coordinators' ? coordinators : secretaries).map((item: any) => (
          <div key={item.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--font-bold)', flexShrink: 0, color: 'var(--on-primary-container)' }}>
                {item.user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0 }}>
                  {item.user?.name}
                  {item.user?.status === 'inactive' && (
                    <span style={{ marginLeft: '8px', fontSize: 'var(--label-sm)', background: 'var(--error-container)', color: 'var(--on-error-container)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>Inativo</span>
                  )}
                </h3>
                <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>{item.user?.email}</p>
                {activeTab === 'coordinators' && (
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--primary)', margin: '2px 0 0' }}>
                    Área: {item.scientific_area?.name} • Curso: {item.course?.code} - {item.course?.name}
                    {item.office && ` • ${item.office}`}
                  </p>
                )}
                {activeTab === 'secretaries' && (
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--primary)', margin: '2px 0 0' }}>
                    Órgão: {item.organ?.name}
                    {item.scientific_area && ` • Área: ${item.scientific_area.name}`}
                    {item.office && ` • ${item.office}`}
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
              <button onClick={() => activeTab === 'coordinators' ? openEditCoordinator(item) : openEditSecretary(item)} style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)', border: 'none', padding: '8px 14px', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontFamily: 'var(--font-family)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
              </button>
              <button onClick={() => handleRemove(item.id)} style={{ background: 'var(--error-container)', color: 'var(--on-error-container)', border: 'none', padding: '8px 16px', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontFamily: 'var(--font-family)' }}>
                Remover
              </button>
            </div>
          </div>
        ))}
        {((activeTab === 'coordinators' ? coordinators : secretaries).length === 0) && (
          <EmptyState message={`Nenhum ${tabLabel.toLowerCase()} nomeado`} />
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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

function Alert({ type, children, onClose }: { type: 'error' | 'success'; children: React.ReactNode; onClose?: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'var(--space-2) var(--space-3)', marginBottom: 'var(--space-4)',
      borderRadius: 'var(--radius-lg)',
      background: type === 'error' ? 'var(--error-container)' : 'var(--primary-container)',
      color: type === 'error' ? 'var(--on-error-container)' : 'var(--on-primary-container)',
      fontSize: 'var(--body-md)'
    }}>
      <span>{children}</span>
      {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}>✕</button>}
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
      <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>
        {label}
      </label>
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

function FormField({ label, value, onChange, type = 'text', placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{ padding: '10px 14px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none' }}
      />
    </div>
  )
}