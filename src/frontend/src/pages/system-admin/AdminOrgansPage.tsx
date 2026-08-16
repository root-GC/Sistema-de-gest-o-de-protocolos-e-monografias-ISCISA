// src/pages/system-admin/AdminOrgansPage.tsx
import { useEffect, useState } from 'react'
import { adminService, type Organ } from '../../services/adminService'
import '../../styles/global.css'

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
  const [organs, setOrgans] = useState<Organ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('nucleus')
  const [formDescription, setFormDescription] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const response = await adminService.listOrgans()
      const organsData = response.data || []
      setOrgans(Array.isArray(organsData) ? organsData : [])
      
      console.log('Órgãos carregados:', organsData)
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
    setFormType('nucleus')
    setFormDescription('')
    setShowForm(true)
  }

  function openEditOrgan(organ: Organ) {
    setEditingId(organ.id)
    setFormName(organ.name)
    setFormType(organ.type)
    setFormDescription(organ.description || '')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const organData = {
        name: formName,
        type: formType,
        description: formDescription || undefined
      }

      if (editingId) {
        await adminService.updateOrgan(editingId, organData)
        setSuccessMessage('Órgão atualizado!')
      } else {
        await adminService.createOrgan(organData)
        setSuccessMessage('Órgão criado!')
      }
      setShowForm(false)
      await loadData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e) {
      console.error('Erro ao salvar órgão:', e)
      setError((e as Error).message)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Tem certeza que deseja eliminar?')) return
    try {
      await adminService.deleteOrgan(id)
      setSuccessMessage('Eliminado com sucesso!')
      await loadData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e) {
      console.error('Erro ao deletar órgão:', e)
      setError((e as Error).message)
    }
  }

  if (loading) return <Loader />

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>Administração de Órgãos</h1>
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>Gira os órgãos do sistema</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {successMessage && <Alert type="success">{successMessage}</Alert>}

      {/* Botão Criar */}
      <button onClick={openCreateForm} style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '10px 16px',
        background: 'var(--primary)', color: 'var(--on-primary)', border: 'none',
        borderRadius: 'var(--radius-lg)', cursor: 'pointer', marginBottom: 'var(--space-3)',
        fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', fontFamily: 'var(--font-family)'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
        Novo Órgão
      </button>

      {/* Modal Form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3)' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', width: '100%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>
              {editingId ? 'Editar' : 'Criar'} Órgão
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <FormField label="Nome" value={formName} onChange={setFormName} required />
              <FormSelect 
                label="Tipo" 
                value={formType} 
                onChange={setFormType} 
                options={Object.entries(ORGAN_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))} 
              />
              <FormField label="Descrição" value={formDescription} onChange={setFormDescription} />
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
        {organs.length === 0 ? (
          <EmptyState message="Nenhum órgão encontrado" />
        ) : (
          organs.map((organ: Organ) => (
            <div key={organ.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0 }}>
                  {organ.name}
                </h3>
                <span style={{ fontSize: 'var(--label-sm)', color: ORGAN_TYPE_COLORS[organ.type] || 'var(--outline)', background: 'var(--surface-container)', padding: '2px 8px', borderRadius: 'var(--radius-full)', marginTop: '4px', display: 'inline-block' }}>
                  {ORGAN_TYPE_LABELS[organ.type] || organ.type}
                </span>
                {organ.description && (
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '4px 0 0' }}>{organ.description}</p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                <IconButton icon="edit" onClick={() => openEditOrgan(organ)} />
                <IconButton icon="delete" color="var(--error)" onClick={() => handleDelete(organ.id)} />
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