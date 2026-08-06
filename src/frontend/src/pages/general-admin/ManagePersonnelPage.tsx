// src/pages/general-admin/ManagePersonnelPage.tsx
import { useEffect, useState } from 'react'
import { generalAdminService, type Coordinator, type Secretary, type ScientificArea, type Course } from '../../services/generalAdminService'
import { adminService } from '../../services/adminService'
import { useAuth } from '../../context/AuthContext'
import '../../styles/global.css'

type TabType = 'coordinators' | 'secretaries' | 'presidents'

const ORGAN_TYPE_LABELS: Record<string, string> = {
  nucleus: 'Núcleo Científico',
  scientific_committee: 'Comité Científico',
  bioethics_committee: 'Comité de Bioética',
  scientific_direction: 'Direção Científica',
}

interface President {
  id: number
  user_id: number
  user?: { id: number; name: string; email: string; status: string }
  organ_id: number
  organ?: { id: number; name: string; type: string }
  created_at: string
}

export default function ManagePersonnelPage() {
  const { user, profiles } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('coordinators')
  const [coordinators, setCoordinators] = useState<Coordinator[]>([])
  const [secretaries, setSecretaries] = useState<Secretary[]>([])
  const [presidents, setPresidents] = useState<President[]>([])
  const [areas, setAreas] = useState<ScientificArea[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [organs, setOrgans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [adminOrganId, setAdminOrganId] = useState<number | null>(null)
  const [adminOrganName, setAdminOrganName] = useState<string>('Carregando...')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formAreaId, setFormAreaId] = useState<number | null>(null)
  const [formCourseId, setFormCourseId] = useState<number | null>(null)
  const [formOrganId, setFormOrganId] = useState<number | null>(null)
  const [formOffice, setFormOffice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadAdminOrgan()
    loadData()
  }, [activeTab])

  async function loadAdminOrgan() {
    try {
      const adminProfile = profiles?.admin
      
      if (adminProfile) {
        const organId = (adminProfile as any).organ_id || adminProfile.organ?.id
        const organName = adminProfile.organ?.name
        
        if (organId) {
          setAdminOrganId(organId)
          setAdminOrganName(organName || `Órgão #${organId}`)
          return
        }
      }

      const userId = user?.id
      if (userId) {
        try {
          // CORREÇÃO: Usar o endpoint correto - /api/v1/users/{id}
          const response = await adminService.getUser(Number(userId))
          const userData = (response as any)?.data || response
          const adminProfileFromApi = userData?.profiles?.admin

          if (adminProfileFromApi) {
            const organId = (adminProfileFromApi as any).organ_id || adminProfileFromApi.organ?.id
            const organName = adminProfileFromApi.organ?.name
            
            if (organId) {
              setAdminOrganId(organId)
              setAdminOrganName(organName || `Órgão #${organId}`)
              return
            }
          }
        } catch (apiError) {
          console.error('Erro ao buscar dados do utilizador:', apiError)
        }
      }

      // CORREÇÃO: Usar /api/v1/organs em vez de adminService.listOrgans()
      try {
        const organsResponse = await generalAdminService.listOrgans()
        const organsData = Array.isArray(organsResponse?.data) ? organsResponse.data : 
                           Array.isArray(organsResponse) ? organsResponse : []
        
        const scientificDirection = Array.isArray(organsData) 
          ? organsData.find((o: any) => o.type === 'scientific_direction')
          : null
        
        if (scientificDirection) {
          setAdminOrganId(scientificDirection.id)
          setAdminOrganName(scientificDirection.name)
          return
        }
      } catch (organsError) {
        console.error('Erro ao buscar órgãos:', organsError)
      }

      setAdminOrganName('Não definido')
    } catch (e) {
      console.error('Erro em loadAdminOrgan:', e)
      setAdminOrganName('Não definido')
    }
  }

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [areasResponse, coursesResponse, organsResponse] = await Promise.all([
        generalAdminService.listAllAreas(),
        generalAdminService.listAllCourses(),
        generalAdminService.listOrgans(), // CORREÇÃO: Usar generalAdminService
      ])
      
      setAreas(Array.isArray(areasResponse?.data) ? areasResponse.data : Array.isArray(areasResponse) ? areasResponse : [])
      setCourses(Array.isArray(coursesResponse?.data) ? coursesResponse.data : Array.isArray(coursesResponse) ? coursesResponse : [])
      
      // Órgãos disponíveis para presidentes (todos exceto Direção Científica)
      const organsData = Array.isArray(organsResponse?.data) ? organsResponse.data : 
                         Array.isArray(organsResponse) ? organsResponse : []
      setOrgans(Array.isArray(organsData) ? organsData.filter((o: any) => o.type !== 'scientific_direction') : [])

      if (activeTab === 'coordinators') {
        try {
          const response = await generalAdminService.listCoordinators()
          const data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []
          
          const normalized = data.map((item: any) => {
            const profile = item.coordinator_profile || {}
            return {
              ...item,
              id: item.id,
              user: item.user || { id: item.id, name: item.name, email: item.email, status: item.status },
              scientific_area_id: profile.scientific_area_id,
              course_id: profile.course_id,
              office: profile.office || '',
              course: profile.course || null,
              scientific_area: profile.course?.scientific_area || null
            }
          })
          
          setCoordinators(normalized)
        } catch {
          setCoordinators([])
        }
      } else if (activeTab === 'secretaries') {
        try {
          const response = await generalAdminService.listSecretaries()
          const data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []
          
          const normalized = data.map((item: any) => {
            const profile = item.secretary_profile || {}
            return {
              ...item,
              id: item.id,
              user: item.user || { id: item.id, name: item.name, email: item.email, status: item.status },
              organ_id: profile.organ_id,
              scientific_area_id: profile.scientific_area_id || null,
              office: profile.office || '',
              organ: profile.organ || null,
              scientific_area: profile.scientific_area || null
            }
          })
          
          setSecretaries(normalized)
        } catch {
          setSecretaries([])
        }
      } else if (activeTab === 'presidents') {
        try {
          // CORREÇÃO: Buscar admins via /api/v1/users?role=admin
          const response = await adminService.listUsers({ role: 'admin' })
          const data = Array.isArray(response?.data) ? response.data : 
                       Array.isArray(response) ? response : []
          
          console.log('📡 Total de admins carregados:', data.length)
          console.log('📋 Dados brutos:', data)
          
          // Filtrar apenas presidentes dos outros órgãos (não Direção Científica)
          const normalized = data
            .filter((item: any) => {
              const adminProf = item.profiles?.admin || item.adminProfile || item.admin_profile
              const organ = adminProf?.organ
              // Só incluir se tem órgão E não é Direção Científica
              return organ && organ.type !== 'scientific_direction'
            })
            .map((item: any) => {
              const adminProf = item.profiles?.admin || item.adminProfile || item.admin_profile || {}
              return {
                id: item.id,
                user_id: item.id,
                user: { id: item.id, name: item.name, email: item.email, status: item.status },
                organ_id: adminProf.organ_id || adminProf.organ?.id,
                organ: adminProf.organ || null,
                created_at: item.created_at || ''
              }
            })
          
          console.log('👥 Presidentes (excluindo Dir. Científica):', normalized.length)
          console.log('📋 Presidentes:', normalized.map(p => ({ name: p.user?.name, organ: p.organ?.name })))
          
          setPresidents(normalized)
        } catch (e) {
          console.error('Erro ao carregar presidentes:', e)
          setPresidents([])
        }
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
    setFormEmail('')
    setFormAreaId(null)
    setFormCourseId(null)
    setFormOrganId(null)
    setFormOffice('')
    setShowForm(true)
  }

  function openEditCoordinator(coordinator: any) {
    setEditingId(coordinator.id)
    setFormName(coordinator.user?.name || coordinator.name || '')
    setFormEmail(coordinator.user?.email || coordinator.email || '')
    setFormAreaId(coordinator.scientific_area_id)
    setFormCourseId(coordinator.course_id)
    setFormOffice(coordinator.office || '')
    setShowForm(true)
  }

  function openEditSecretary(secretary: any) {
    setEditingId(secretary.id)
    setFormName(secretary.user?.name || secretary.name || '')
    setFormEmail(secretary.user?.email || secretary.email || '')
    setFormAreaId(secretary.scientific_area_id || null)
    setFormOffice(secretary.office || '')
    setShowForm(true)
  }

  function openEditPresident(president: any) {
    setEditingId(president.id)
    setFormName(president.user?.name || president.name || '')
    setFormEmail(president.user?.email || president.email || '')
    setFormOrganId(president.organ_id)
    setShowForm(true)
  }

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
      } else if (activeTab === 'presidents') {
        if (editingId) {
          // CORREÇÃO: Atualizar presidente via /api/v1/users/{id} (PUT)
          await adminService.updateUser(editingId, {
            name: formName,
            email: formEmail,
            organ_id: formOrganId!,
          })
          setSuccessMessage('Presidente atualizado!')
        } else {
          // CORREÇÃO: Criar presidente via /api/v1/users (POST)
          await adminService.createUser({
            name: formName,
            email: formEmail,
            organ_id: formOrganId!,
          })
          setSuccessMessage('Presidente criado! Convite enviado.')
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

  async function handleRemove(id: number) {
    if (!window.confirm('Tem certeza que deseja remover?')) return
    try {
      if (activeTab === 'coordinators') {
        await generalAdminService.removeCoordinator(id)
      } else if (activeTab === 'secretaries') {
        await generalAdminService.removeSecretary(id)
      } else if (activeTab === 'presidents') {
        // CORREÇÃO: Remover presidente via /api/v1/users/{id} (DELETE)
        await adminService.deleteUser(id)
      }
      setSuccessMessage('Removido com sucesso!')
      await loadData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (loading) return <Loader />

  const tabLabel = activeTab === 'coordinators' ? 'Coordenador' : activeTab === 'secretaries' ? 'Secretário' : 'Presidente'

  const safeAreas = Array.isArray(areas) ? areas : []
  const safeCourses = Array.isArray(courses) ? courses : []
  const safeOrgans = Array.isArray(organs) ? organs : []

  const filteredCourses = formAreaId
    ? safeCourses.filter(c => c.scientific_area_id === formAreaId)
    : safeCourses

  const organAreas = adminOrganId
    ? safeAreas.filter(a => a.organ_id === adminOrganId)
    : safeAreas

  const list = activeTab === 'coordinators' 
    ? (Array.isArray(coordinators) ? coordinators : [])
    : activeTab === 'secretaries'
    ? (Array.isArray(secretaries) ? secretaries : [])
    : (Array.isArray(presidents) ? presidents : [])

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>
          Gestão de Pessoal
        </h1>
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
          Nomeie coordenadores, secretários e presidentes de órgão
        </p>
      </div>

      {error && <Alert type="error" onClose={() => setError(null)}>{error}</Alert>}
      {successMessage && <Alert type="success" onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '2px solid var(--outline-variant)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        {[
          { id: 'coordinators' as TabType, label: 'Coordenadores', icon: 'person_check', count: coordinators.length },
          { id: 'secretaries' as TabType, label: 'Secretários', icon: 'assignment', count: secretaries.length },
          { id: 'presidents' as TabType, label: 'Presidentes', icon: 'shield_person', count: presidents.length },
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

      {/* Modal Form */}
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

                  <div style={{
                    padding: 'var(--space-3)',
                    background: adminOrganId ? 'var(--surface-container)' : 'var(--error-container)',
                    borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${adminOrganId ? 'var(--outline-variant)' : 'var(--error)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)'
                  }}>
                    <span className="material-symbols-outlined" style={{ color: adminOrganId ? 'var(--primary)' : 'var(--error)', fontSize: '24px', flexShrink: 0 }}>account_balance</span>
                    <div>
                      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: 0 }}>Órgão</p>
                      <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', color: adminOrganId ? 'var(--on-surface)' : 'var(--error)', margin: '2px 0 0' }}>{adminOrganName}</p>
                    </div>
                  </div>

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
                    <div style={{ padding: 'var(--space-2)', background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
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

              {/* ═══════ PRESIDENTES ═══════ */}
              {activeTab === 'presidents' && (
                <>
                  <FormField label="Nome *" value={formName} onChange={setFormName} required />
                  <FormField label="Email *" value={formEmail} onChange={setFormEmail} type="email" required />
                  
                  <FormSelect
                    label="Órgão *"
                    value={String(formOrganId || '')}
                    onChange={v => setFormOrganId(v ? Number(v) : null)}
                    options={safeOrgans.map(o => ({ 
                      value: String(o.id), 
                      label: `${o.name} (${ORGAN_TYPE_LABELS[o.type] || o.type})` 
                    }))}
                    required
                  />

                  {!editingId && (
                    <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', background: 'var(--tertiary-container)', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', margin: 0 }}>
                      📧 Um email será enviado com um link para definir a senha. O presidente terá acesso ao painel de administração do seu órgão.
                    </p>
                  )}
                </>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn" disabled={isSubmitting}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting && <span style={{ width: '16px', height: '16px', border: '2px solid var(--on-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                  {isSubmitting ? 'A processar...' : editingId ? 'Atualizar' : 'Nomear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {list.length === 0 ? (
          <EmptyState message={`Nenhum ${tabLabel.toLowerCase()} nomeado`} />
        ) : (
          list.map((item: any) => {
            const userName = item.user?.name || item.name || '?'
            const userEmail = item.user?.email || item.email || ''
            const userStatus = item.user?.status || item.status || 'active'
            
            return (
              <div key={item.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--font-bold)', flexShrink: 0, color: 'var(--on-primary-container)' }}>
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0 }}>
                      {userName}
                      {userStatus === 'inactive' && (
                        <span style={{ marginLeft: '8px', fontSize: 'var(--label-sm)', background: 'var(--error-container)', color: 'var(--on-error-container)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>Inativo</span>
                      )}
                    </h3>
                    <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>{userEmail}</p>
                    
                    {activeTab === 'coordinators' && (
                      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--primary)', margin: '2px 0 0' }}>
                        Área: {item.scientific_area?.name || item.course?.scientific_area?.name || '—'} • Curso: {item.course?.code ? `${item.course.code} - ${item.course.name}` : (item.course?.name || '—')}
                        {item.office && ` • ${item.office}`}
                      </p>
                    )}
                    
                    {activeTab === 'secretaries' && (
                      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--primary)', margin: '2px 0 0' }}>
                        Órgão: {item.organ?.name || adminOrganName || '—'}
                        {item.scientific_area?.name && ` • Área: ${item.scientific_area.name}`}
                        {item.office && ` • ${item.office}`}
                      </p>
                    )}
                    
                    {activeTab === 'presidents' && (
                      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--primary)', margin: '2px 0 0' }}>
                        Órgão: {item.organ?.name || '—'}
                        {item.organ?.type && ` (${ORGAN_TYPE_LABELS[item.organ.type] || item.organ.type})`}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                  <button onClick={() => {
                    if (activeTab === 'coordinators') openEditCoordinator(item)
                    else if (activeTab === 'secretaries') openEditSecretary(item)
                    else openEditPresident(item)
                  }} style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)', border: 'none', padding: '8px 14px', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontFamily: 'var(--font-family)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                  </button>
                  <button onClick={() => handleRemove(item.id)} style={{ background: 'var(--error-container)', color: 'var(--on-error-container)', border: 'none', padding: '8px 16px', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontFamily: 'var(--font-family)' }}>
                    Remover
                  </button>
                </div>
              </div>
            )
          })
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