import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { organWorkspaceService } from '../../services/organWorkspaceService'
import type { SubmissionDocumentRequirement } from '../../services/protocolService'
import './documentRequirements.css'

export default function DocumentRequirementsPage() {
  const { activeRole } = useAuth()
  const [requirements, setRequirements] = useState<SubmissionDocumentRequirement[]>([])
  const [organName, setOrganName] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [optional, setOptional] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isPresident = activeRole === 'admin'

  async function load() {
    setLoading(true)
    try {
      const response = await organWorkspaceService.documentRequirements()
      setOrganName(response.organ.name)
      setRequirements(response.requirements)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar os documentos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const requestId = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(requestId)
  }, [])

  async function create(event: FormEvent) {
    event.preventDefault()
    if (!isPresident || !name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await organWorkspaceService.addDocumentRequirement({ name: name.trim(), description: description.trim() || null, is_optional: optional })
      setName('')
      setDescription('')
      setOptional(false)
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível adicionar o documento.')
    } finally {
      setSaving(false)
    }
  }

  async function update(item: SubmissionDocumentRequirement, changes: Partial<SubmissionDocumentRequirement>) {
    setUpdatingId(item.id)
    setError(null)
    try {
      await organWorkspaceService.updateDocumentRequirement(item.id, changes)
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível atualizar o documento.')
    } finally {
      setUpdatingId(null)
    }
  }

  function beginEdit(item: SubmissionDocumentRequirement) {
    setEditingId(item.id)
    setEditName(item.name)
    setEditDescription(item.description ?? '')
  }

  async function saveEdit(item: SubmissionDocumentRequirement) {
    if (!editName.trim()) return
    await update(item, { name: editName.trim(), description: editDescription.trim() || null })
    setEditingId(null)
  }

  return (
    <main className="document-requirements-page" aria-labelledby="document-requirements-title">
      <header className="document-requirements-header">
        <p className="document-requirements-eyebrow">{organName || 'O meu órgão'}</p>
        <h1 id="document-requirements-title">Documentos necessários</h1>
        <p>Configure os anexos exigidos nas novas submissões de protocolo.</p>
      </header>

      {error && <div className="document-requirements-alert" role="alert"><span className="material-symbols-outlined" aria-hidden="true">error</span><span>{error}</span></div>}

      {isPresident && <form className="document-requirements-card document-requirements-form" onSubmit={create}>
        <div className="document-requirements-card__heading"><span className="material-symbols-outlined" aria-hidden="true">note_add</span><div><h2>Adicionar documento</h2><p>O documento ficará disponível apenas para as próximas submissões.</p></div></div>
        <div className="document-requirements-form__grid"><label className="document-requirements-field">Nome do documento<input value={name} onChange={event => setName(event.target.value)} maxLength={255} required /></label><label className="document-requirements-field">Descrição<textarea value={description} onChange={event => setDescription(event.target.value)} rows={3} maxLength={5000} /></label></div>
        <label className="document-requirements-choice"><input type="checkbox" checked={optional} onChange={event => setOptional(event.target.checked)} /><span><strong>Opcional</strong><small>O estudante pode enviar este documento quando for aplicável.</small></span></label>
        <div className="document-requirements-form__actions"><button className="btn btn-primary" disabled={saving}><span className="material-symbols-outlined" aria-hidden="true">add</span>{saving ? 'A adicionar...' : 'Adicionar documento'}</button></div>
      </form>}

      <section className="document-requirements-card document-requirements-list" aria-labelledby="document-list-title" aria-live="polite">
        <div className="document-requirements-list__header"><div><h2 id="document-list-title">Lista de documentos</h2><p>{requirements.length} documento{requirements.length === 1 ? '' : 's'} configurado{requirements.length === 1 ? '' : 's'}.</p></div></div>
        {loading ? <div className="document-requirements-empty"><span className="material-symbols-outlined" aria-hidden="true">progress_activity</span>A carregar documentos...</div> : requirements.length === 0 ? <div className="document-requirements-empty"><span className="material-symbols-outlined" aria-hidden="true">folder_open</span><strong>Sem documentos configurados</strong><span>Os documentos adicionados aparecerão nesta lista.</span></div> : <div className="document-requirements-items">{requirements.map(item => {
          const isEditing = editingId === item.id
          const isUpdating = updatingId === item.id
          const stateLabel = item.is_active ? (item.is_optional ? 'Opcional' : 'Obrigatório') : 'Desativado'
          return <article key={item.id} className={`document-requirement${item.is_active ? '' : ' is-inactive'}`}>
            {isEditing ? <div className="document-requirement__edit"><label className="document-requirements-field">Nome do documento<input value={editName} onChange={event => setEditName(event.target.value)} maxLength={255} required /></label><label className="document-requirements-field">Descrição<textarea value={editDescription} onChange={event => setEditDescription(event.target.value)} rows={3} maxLength={5000} /></label><div className="document-requirement__actions"><button type="button" className="btn btn-primary btn-sm" onClick={() => void saveEdit(item)} disabled={isUpdating}>Guardar</button><button type="button" className="btn btn-outline btn-sm" onClick={() => setEditingId(null)} disabled={isUpdating}>Cancelar</button></div></div> : <>
              <div className="document-requirement__content"><span className="document-requirement__icon material-symbols-outlined" aria-hidden="true">description</span><div><div className="document-requirement__title"><h3>{item.name}</h3><span className={`document-requirement__badge ${item.is_active ? item.is_optional ? 'is-optional' : 'is-required' : 'is-inactive'}`}>{stateLabel}</span></div><p>{item.description || 'Sem descrição.'}</p></div></div>
              <div className="document-requirement__actions">{isPresident && <button type="button" className="btn btn-outline btn-sm" onClick={() => beginEdit(item)} disabled={isUpdating}>Editar</button>}<button type="button" className="btn btn-outline btn-sm" onClick={() => void update(item, { is_optional: !item.is_optional })} disabled={isUpdating || !item.is_active}>{item.is_optional ? 'Tornar obrigatório' : 'Tornar opcional'}</button><button type="button" className={item.is_active ? 'btn btn-danger btn-sm' : 'btn btn-outline btn-sm'} onClick={() => void update(item, { is_active: !item.is_active })} disabled={isUpdating}>{item.is_active ? 'Desativar' : 'Ativar'}</button></div>
            </>}
          </article>
        })}</div>}
      </section>
    </main>
  )
}
