import { useCallback, useEffect, useState } from 'react'
import PdfPreviewModal from '../PdfPreviewModal'
import { type Protocol } from '../../services/protocolService'
import '../../pages/teacher/reviewerWorkspace.css'

type Props = {
  protocol: Protocol | null
  open: boolean
  onClose: () => void
}

type PreviewAttachment = {
  name: string
  fileName: string
  downloadUrl: string
}

function attachmentState(attachment: NonNullable<Protocol['reviewer_attachments']>[number]) {
  if (!attachment.uploaded) return { icon: 'upload_file', label: 'Não enviado', tone: 'missing' }
  if (attachment.approved === true) return { icon: 'verified', label: attachment.status_label || 'Aprovado', tone: 'approved' }
  if (attachment.approved === false) return { icon: 'error', label: attachment.status_label || 'Não aprovado', tone: 'rejected' }
  return { icon: 'pending_actions', label: attachment.status_label || 'Disponível', tone: 'pending' }
}

export function ReviewerProtocolAttachmentsDialog({ protocol, open, onClose }: Props) {
  const [previewAttachment, setPreviewAttachment] = useState<PreviewAttachment | null>(null)

  const closeAttachments = useCallback(() => {
    setPreviewAttachment(null)
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeAttachments()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, closeAttachments])

  if (!open || !protocol) return null

  if (previewAttachment) {
    return (
      <PdfPreviewModal
        url={previewAttachment.downloadUrl}
        title={previewAttachment.name}
        filename={previewAttachment.fileName}
        closeLabel="Voltar aos anexos"
        onClose={() => setPreviewAttachment(null)}
      />
    )
  }

  const attachments = protocol.reviewer_attachments || []
  const organName = protocol.my_assignment?.organ?.name || 'teu órgão'

  return (
    <div className="reviewer-dialog-backdrop" role="presentation" onMouseDown={closeAttachments}>
      <section className="reviewer-dialog" role="dialog" aria-modal="true" aria-labelledby="reviewer-attachments-title" onMouseDown={event => event.stopPropagation()}>
        <header className="reviewer-dialog__header">
          <div>
            <p className="reviewer-dialog__eyebrow">{protocol.code}</p>
            <h2 id="reviewer-attachments-title">Anexos do Protocolo</h2>
            <p>Documentos disponibilizados para {organName}.</p>
          </div>
          <button type="button" className="btn btn-icon" aria-label="Fechar anexos" onClick={closeAttachments}>
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </header>

        <div className="reviewer-dialog__body">
          {attachments.length === 0 ? (
            <div className="reviewer-empty-state">
              <span className="material-symbols-outlined" aria-hidden="true">folder_off</span>
              <strong>Sem anexos para este órgão</strong>
              <span>Não há documentos associados à etapa desta revisão.</span>
            </div>
          ) : (
            <ul className="reviewer-attachment-list">
              {attachments.map(attachment => {
                const state = attachmentState(attachment)
                const filename = attachment.file_name || attachment.name

                return (
                  <li key={attachment.id} className="reviewer-attachment-item">
                    <span className={`reviewer-attachment-item__icon reviewer-attachment-item__icon--${state.tone}`}>
                      <span className="material-symbols-outlined" aria-hidden="true">{state.icon}</span>
                    </span>
                    <span className="reviewer-attachment-item__content">
                      <strong>{attachment.name}</strong>
                      <small>{filename}{attachment.is_optional ? ' · Opcional' : ''}</small>
                    </span>
                    <span className={`reviewer-status reviewer-status--${state.tone}`}>{state.label}</span>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => attachment.download_url && setPreviewAttachment({
                        name: attachment.name,
                        fileName: filename,
                        downloadUrl: attachment.download_url,
                      })}
                      disabled={!attachment.download_url}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">visibility</span>Visualizar
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
