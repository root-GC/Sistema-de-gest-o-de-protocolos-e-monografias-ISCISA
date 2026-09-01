import { useEffect, useState } from 'react'
import { protocolService, type ProtocolReviewContext as ReviewContext } from '../../services/protocolService'

interface Props {
  protocolId: number
}

export function ProtocolReviewContext({ protocolId }: Props) {
  const [context, setContext] = useState<ReviewContext | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    protocolService.getReviewContext(protocolId)
      .then(result => { if (active) setContext(result.review_context) })
      .catch(requestError => { if (active) setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar o contexto.') })
    return () => { active = false }
  }, [protocolId])

  if (error) return <div className="eval-notice eval-notice--error" role="status">{error}</div>
  if (!context) return <div className="empty-state" aria-live="polite">A carregar contexto da revisão...</div>

  return (
    <section className="card" style={{ padding: 'var(--space-3)', marginBottom: 'var(--space-3)' }} aria-labelledby="review-context-title">
      <h2 id="review-context-title" className="section-title"><span className="material-symbols-outlined">history_edu</span>Contexto do processo</h2>
      {context.topic && (
        <div style={{ marginTop: 'var(--space-2)' }}>
          <strong>Tema aprovado pelo Núcleo</strong>
          <p style={{ margin: 'var(--space-1) 0' }}>{context.topic.title}</p>
          {context.topic.download_url && <button type="button" className="btn btn-outline" onClick={() => protocolService.openFile(context.topic!.download_url!, context.topic!.document_name || 'tema.docx')}>Abrir documento do tema</button>}
          {context.topic.comments.length > 0 && <div className="comments-list" style={{ marginTop: 'var(--space-2)' }}>{context.topic.comments.map(comment => <div key={comment.id} className="comment-item"><p>{comment.content}</p><small>{comment.author?.name || 'Autor'} · {new Date(comment.created_at).toLocaleString('pt-PT')}</small></div>)}</div>}
          {context.topic.evaluations.length > 0 && <div style={{ marginTop: 'var(--space-2)' }}><strong>Avaliações do Núcleo</strong>{context.topic.evaluations.map((evaluation, index) => <p key={`${evaluation.evaluated_at}-${index}`}>{evaluation.decision === 'approved' ? 'Aprovado' : 'Não aprovado'}{evaluation.comment ? ` · ${evaluation.comment}` : ''}</p>)}</div>}
        </div>
      )}
      <div style={{ marginTop: 'var(--space-3)' }}>
        <strong>Versões oficiais do protocolo</strong>
        <div style={{ display: 'grid', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>{context.documents.map(document => <div key={document.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', alignItems: 'center' }}><span>{document.label} · {document.file_name}</span><button type="button" className="btn btn-outline" onClick={() => protocolService.openFile(document.download_url, document.file_name)}>Abrir</button></div>)}</div>
      </div>
      {context.cc_context && <div style={{ marginTop: 'var(--space-3)' }}><strong>Consulta do Comité Científico</strong><div style={{ display: 'grid', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>{context.cc_context.forms.map(form => <div key={form.id}><span>{form.version} · {form.decision || 'Sem decisão'}</span>{form.conclusion_summary && <p>{form.conclusion_summary}</p>}{form.reviews.map((review, index) => <p key={`${review.submitted_at}-${index}`}>{review.reviewer || 'Revisor do CC'}: {review.decision || review.status}{review.overall_comment ? ` · ${review.overall_comment}` : ''}</p>)}<button type="button" className="btn btn-outline" onClick={() => protocolService.openFile(form.evaluation_form_download_url, `ficha-${form.id}.pdf`)}>Abrir ficha</button>{form.opinions.map(opinion => <button key={opinion.id} type="button" className="btn btn-outline" style={{ marginLeft: 'var(--space-1)' }} onClick={() => protocolService.openFile(opinion.signed_download_url || opinion.download_url, `parecer-${opinion.id}.pdf`)}>Abrir parecer</button>)}</div>)}</div></div>}
    </section>
  )
}
