import { useEffect, useState } from 'react'
import OnlyOfficeEditor from '../OnlyOfficeEditor/OnlyOfficeEditor'
import '../../styles/global.css'

export interface ReviewCommentItem {
  id: number
  content: string
  createdAt: string
  author?: string | null
}

interface DocumentReviewWorkspaceProps {
  document: { kind: 'topic' | 'protocol'; id: number; name?: string | null } | null
  title: string
  code?: string | null
  statusLabel: string
  statusTone?: 'pending' | 'approved' | 'rejected'
  comments: ReviewCommentItem[]
  commentValue: string
  onCommentChange: (value: string) => void
  onAddComment: () => Promise<void>
  commentSubmitting: boolean
  decision?: 'approved' | 'rejected' | ''
  onDecisionChange?: (value: 'approved' | 'rejected') => void
  onConfirmDecision?: () => Promise<void>
  decisionSubmitting?: boolean
  decisionDone?: boolean
  onDownload?: () => Promise<void>
  backLabel: string
  onBack: () => void
}

export function DocumentReviewWorkspace({
  document,
  title,
  code,
  statusLabel,
  statusTone = 'pending',
  comments,
  commentValue,
  onCommentChange,
  onAddComment,
  commentSubmitting,
  decision = '',
  onDecisionChange,
  onConfirmDecision,
  decisionSubmitting = false,
  decisionDone = false,
  onDownload,
  backLabel,
  onBack,
}: DocumentReviewWorkspaceProps) {
  const [fullscreen, setFullscreen] = useState(false)
  const [editorKey, setEditorKey] = useState(0)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const toneClass = statusTone === 'approved' ? 'is-concluded' : statusTone === 'rejected' ? 'is-rejected' : 'is-pending'
  const reloadEditor = () => setEditorKey(current => current + 1)
  const editor = document
    ? document.kind === 'topic'
      ? <OnlyOfficeEditor key={editorKey} topicId={document.id} height="100%" />
      : <OnlyOfficeEditor key={editorKey} protocolId={document.id} height="100%" />
    : <div className="doc-state-empty"><span className="material-symbols-outlined">description</span><p>Documento DOCX indisponível para revisão.</p></div>

  return (
    <div className="teacher-workspace" style={{ minHeight: 'calc(100vh - 132px)' }}>
      <div className="evaluation-split-view" style={{ minHeight: 'calc(100vh - 132px)' }}>
        <section className="doc-viewer-pane">
          <div className="doc-toolbar">
            <div className="doc-toolbar-left"><span className="doc-filename">{document?.name || 'Documento para revisão'}</span><span className="doc-file-type-badge">DOCX</span></div>
            <div className="doc-toolbar-right">
              <button type="button" onClick={reloadEditor} aria-label="Recarregar editor" title="Recarregar"><span className="material-symbols-outlined">refresh</span></button>
              <button type="button" onClick={() => setFullscreen(true)} aria-label="Abrir em tela cheia" title="Tela cheia"><span className="material-symbols-outlined">fullscreen</span></button>
              {onDownload && <button type="button" onClick={() => void onDownload()} aria-label="Baixar documento" title="Baixar"><span className="material-symbols-outlined">download</span></button>}
            </div>
          </div>
          <div className="doc-content-area">{editor}</div>
        </section>
        <div className="split-pane-divider" aria-hidden="true" />
        <aside className="evaluation-form-pane">
          <header className="evaluation-form-header"><span className="material-symbols-outlined">rate_review</span><span className="evaluation-form-header-title">Comentários e decisão</span></header>
          <div className="evaluation-form-content">
            <div className="eval-info-card">
              <div className="eval-info-header"><span className="eval-info-label">Estado</span><span className={`eval-info-badge ${toneClass}`}>{statusLabel}</span></div>
              <h4>{code || 'Revisão documental'}</h4>
              <p>{title}</p>
            </div>
            <section className="review-comment-panel" aria-labelledby="review-comments-heading">
              <h3 id="review-comments-heading">Comentários</h3>
              <div className="comments-list">
                {comments.length === 0 ? <div className="empty-state"><span className="material-symbols-outlined">forum</span>Nenhum comentário registado.</div> : comments.map(comment => <article key={comment.id} className="comment-item"><div className="comment-header"><span className="comment-author">{comment.author || 'Revisor'}</span><span className="comment-date">{new Date(comment.createdAt).toLocaleString('pt-PT')}</span></div><p>{comment.content}</p></article>)}
              </div>
              {!decisionDone && <div className="eval-field"><label htmlFor="review-comment">Adicionar comentário</label><textarea id="review-comment" value={commentValue} onChange={event => onCommentChange(event.target.value)} rows={4} placeholder="Registe a observação que acompanhará esta revisão." /><button type="button" className="btn btn-outline" disabled={commentSubmitting || !commentValue.trim()} onClick={() => void onAddComment()}>{commentSubmitting ? 'A guardar...' : 'Adicionar comentário'}</button></div>}
            </section>
            {onDecisionChange && onConfirmDecision && !decisionDone && <section className="review-decision-panel" aria-labelledby="review-decision-heading"><h3 id="review-decision-heading">Decisão definitiva</h3><div className="decision-options"><label className={`decision-option ${decision === 'approved' ? 'is-approved' : ''}`}><input type="radio" name="review-decision" checked={decision === 'approved'} onChange={() => onDecisionChange('approved')} /><span className="material-symbols-outlined">check_circle</span>Aprovar</label><label className={`decision-option ${decision === 'rejected' ? 'is-rejected' : ''}`}><input type="radio" name="review-decision" checked={decision === 'rejected'} onChange={() => onDecisionChange('rejected')} /><span className="material-symbols-outlined">cancel</span>Não aprovar</label></div><p>A não aprovação exige comentário registado.</p><button type="button" className="btn btn-primary btn-block" disabled={!decision || decisionSubmitting} onClick={() => void onConfirmDecision()}>{decisionSubmitting ? 'A guardar...' : 'Confirmar decisão definitiva'}</button></section>}
            {decisionDone && <div className="eval-outcome-banner is-concluded"><span className="material-symbols-outlined">task_alt</span><div><strong>Decisão registada</strong><p>A revisão está concluída e não pode ser alterada.</p></div></div>}
            <button type="button" className="btn btn-outline" onClick={onBack}><span className="material-symbols-outlined">arrow_back</span>{backLabel}</button>
          </div>
        </aside>
      </div>
      {fullscreen && <div className="onlyoffice-fullscreen-overlay" role="dialog" aria-modal="true" aria-label="Documento em tela cheia"><div className="onlyoffice-fullscreen-toolbar"><div className="onlyoffice-fullscreen-toolbar-left"><span className="onlyoffice-fullscreen-title">{document?.name || 'Documento para revisão'}</span></div><div className="onlyoffice-fullscreen-toolbar-right"><button type="button" className="onlyoffice-fullscreen-btn" onClick={reloadEditor} aria-label="Recarregar editor"><span className="material-symbols-outlined">refresh</span></button><button type="button" className="onlyoffice-fullscreen-close" onClick={() => setFullscreen(false)}><span className="material-symbols-outlined">close_fullscreen</span><span>Sair</span></button></div></div><div className="onlyoffice-fullscreen-content">{editor}</div></div>}
    </div>
  )
}
