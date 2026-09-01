import { useCallback, useEffect, useState } from 'react'
import { monographService, type Monograph } from '../../../services/monographService'
import '../../../styles/global.css'

function statusStyle(status: string) {
  if (status === 'verificada') return { color: 'var(--primary)', background: 'var(--primary-container)' }
  if (status === 'devolvida') return { color: 'var(--error)', background: 'var(--error-container)' }
  return { color: 'var(--tertiary)', background: 'var(--tertiary-container)' }
}

export function MonographsTab() {
  const [monographs, setMonographs] = useState<Monograph[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [reasonById, setReasonById] = useState<Record<number, string>>({})
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await monographService.listForSecretary()
      setMonographs(response.monographs)
    } catch (requestError) {
      setError((requestError as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function verify(monograph: Monograph, approved: boolean) {
    const reason = (reasonById[monograph.id] || '').trim()
    if (!approved && !reason) {
      setError('Indique o motivo antes de devolver a monografia.')
      return
    }

    setSavingId(monograph.id)
    setError(null)
    setMessage(null)
    try {
      await monographService.verifyDocuments(monograph.id, approved, reason)
      setMessage(approved ? 'Documentos validados com sucesso.' : 'Monografia devolvida ao estudante.')
      await load()
    } catch (requestError) {
      setError((requestError as Error).message)
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return <p aria-live="polite" style={{ color: 'var(--on-surface-variant)' }}>A carregar monografias...</p>
  }

  const pending = monographs.filter(monograph => monograph.status === 'verificacao_documental')

  return (
    <section aria-labelledby="monographs-title" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h2 id="monographs-title" style={{ margin: 0, fontSize: 'var(--title-lg)', fontWeight: 'var(--font-semibold)' }}>Monografias</h2>
          <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--on-surface-variant)' }}>{pending.length} aguardam verificacao documental.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => void load()}>
          <span className="material-symbols-outlined" aria-hidden="true">refresh</span>
          Atualizar
        </button>
      </header>

      {error && <p role="alert" style={{ margin: 0, padding: 'var(--space-2)', color: 'var(--on-error-container)', background: 'var(--error-container)', borderRadius: 'var(--radius-lg)' }}>{error}</p>}
      {message && <p role="status" aria-live="polite" style={{ margin: 0, padding: 'var(--space-2)', color: 'var(--on-primary-container)', background: 'var(--primary-container)', borderRadius: 'var(--radius-lg)' }}>{message}</p>}

      {monographs.length === 0 ? (
        <div className="card" style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--on-surface-variant)' }}>Nao ha monografias no teu nucleo.</div>
      ) : monographs.map(monograph => {
        const style = statusStyle(monograph.status)
        const expanded = expandedId === monograph.id
        const isPending = monograph.status === 'verificacao_documental'
        const saving = savingId === monograph.id

        return (
          <article className="card" key={monograph.id} style={{ padding: 'var(--space-2) var(--space-3)' }}>
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : monograph.id)}
              aria-expanded={expanded}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: 'inherit', textAlign: 'left', font: 'inherit' }}
            >
              <span style={{ minWidth: 0 }}>
                <strong>{monograph.code}</strong>
                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '4px' }}>{monograph.title || 'Monografia sem titulo'}</span>
                <span style={{ display: 'block', marginTop: '4px', color: 'var(--on-surface-variant)', fontSize: 'var(--label-sm)' }}>{monograph.student?.name || 'Estudante indisponivel'} · Versao {monograph.version || monograph.submission_number}</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', flexShrink: 0, padding: '4px 8px', color: style.color, background: style.background, borderRadius: 'var(--radius-md)', fontSize: 'var(--label-sm)' }}>{monograph.status_label}<span className="material-symbols-outlined" aria-hidden="true">{expanded ? 'expand_less' : 'expand_more'}</span></span>
            </button>

            {expanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--outline-variant)' }}>
                <div aria-label="Documentos da monografia" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  {monograph.documents.length === 0 ? <p style={{ margin: 0, color: 'var(--on-surface-variant)' }}>Sem documento disponivel nesta versao.</p> : monograph.documents.map(document => (
                    <div key={document.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)' }}>
                      <span className="material-symbols-outlined" aria-hidden="true">description</span>
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{document.file_name}</span>
                      <span style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--label-sm)' }}>V{document.version}</span>
                      {document.download_url && <button type="button" className="btn btn-outline" aria-label={`Descarregar ${document.file_name}`} onClick={() => void monographService.downloadFile(document.download_url as string, document.file_name)}><span className="material-symbols-outlined" aria-hidden="true">download</span></button>}
                    </div>
                  ))}
                </div>

                {isPending && (
                  <>
                    <label htmlFor={`return-reason-${monograph.id}`} style={{ fontWeight: 'var(--font-medium)' }}>Observacao para devolucao</label>
                    <textarea id={`return-reason-${monograph.id}`} value={reasonById[monograph.id] || ''} onChange={event => setReasonById(current => ({ ...current, [monograph.id]: event.target.value }))} rows={3} placeholder="Obrigatoria apenas se devolver a monografia" />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-outline" disabled={saving} onClick={() => void verify(monograph, false)}>Devolver</button>
                      <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void verify(monograph, true)}>Validar documentos</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </article>
        )
      })}
    </section>
  )
}
