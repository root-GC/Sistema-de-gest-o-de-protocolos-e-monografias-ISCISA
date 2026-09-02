import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { downloadApiFile } from '../../services/apiClient'
import { organWorkspaceService, type OrganProtocolDetail } from '../../services/organWorkspaceService'

export default function OrganProtocolDetailPage() {
  const { protocolId } = useParams()
  const [protocol, setProtocol] = useState<OrganProtocolDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function download(url: string, filename: string) {
    try {
      await downloadApiFile(url, filename)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível descarregar o documento.')
    }
  }

  useEffect(() => {
    if (!protocolId) return
    void organWorkspaceService.protocol(Number(protocolId)).then(response => setProtocol(response.protocol)).catch(requestError => setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar o protocolo.'))
  }, [protocolId])
  if (error) return <main className="card" style={{ padding: 'var(--space-4)', color: 'var(--error)' }}>{error}</main>
  if (!protocol) return <main>A carregar protocolo...</main>
  return <main style={{ display: 'grid', gap: 'var(--space-3)' }}>
    <header><p style={{ color: 'var(--primary)', fontWeight: 'var(--font-semibold)' }}>{protocol.code}</p><h1 style={{ margin: 0 }}>{protocol.topic?.title}</h1><p style={{ color: 'var(--on-surface-variant)' }}>{protocol.status_label}</p></header>
    <section className="card" style={{ padding: 'var(--space-3)' }}><h2 style={{ marginTop: 0 }}>Revisores e avaliações</h2>{protocol.evaluations.map(form => <div key={form.id} style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' }}><strong>{form.version} · {form.status}</strong>{form.reviewers.map(reviewer => <div key={reviewer.id} style={{ padding: 'var(--space-2) 0' }}><strong>{reviewer.name ?? 'Revisor'}</strong> · {reviewer.status}{reviewer.decision && <> · {reviewer.decision}</>}<p>{reviewer.comment}</p>{reviewer.criteria.map((criterion, index) => <p key={index} style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)' }}>{criterion.criterion}: {criterion.comment}</p>)}</div>)}</div>)}{protocol.evaluations.length === 0 && <p>Sem avaliações atribuídas neste órgão.</p>}</section>
    <section className="card" style={{ padding: 'var(--space-3)' }}><h2 style={{ marginTop: 0 }}>Anexos do órgão</h2>{protocol.requirements.map(item => <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', padding: 'var(--space-1) 0' }}><span>{item.name}{item.is_optional ? ' (opcional)' : ''} · {item.approved === true ? 'Aprovado' : item.approved === false ? 'Não aprovado' : item.sent ? 'Pendente' : 'Não enviado'}</span>{item.download_url && <button type="button" className="btn btn-small" onClick={() => void download(item.download_url!, item.name)}>Baixar</button>}</div>)}</section>
    <section className="card" style={{ padding: 'var(--space-3)' }}><h2 style={{ marginTop: 0 }}>Histórico</h2>{protocol.history.map(event => <p key={event.id}><strong>{event.description || event.action}</strong><br /><small>{event.actor?.name ?? 'Sistema'} · {new Date(event.occurred_at).toLocaleString('pt-PT')}</small></p>)}</section>
  </main>
}
