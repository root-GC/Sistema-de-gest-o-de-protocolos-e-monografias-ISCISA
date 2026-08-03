import type { Protocol, ProtocolDocumentRequirement } from '../../services/protocolService'

type Props = {
  protocol: Protocol
  reviewingRequirementId: number | null
  rejectionReasons: Record<number, string>
  onReasonChange: (requirementId: number, reason: string) => void
  onApprove: (protocolId: number, requirementId: number) => void
  onReject: (protocolId: number, requirementId: number) => void
  onDownload: (url: string | null | undefined, fallbackFilename?: string | null) => void
}

function getRequirementState(requirement: ProtocolDocumentRequirement) {
  if (requirement.aprovado === true) {
    return {
      icon: 'check_circle',
      label: requirement.status_label || 'Aprovado',
      color: 'var(--primary)',
      background: 'var(--primary-container)',
    }
  }

  if (requirement.aprovado === false) {
    return {
      icon: 'error',
      label: requirement.status_label || 'Reprovado',
      color: 'var(--error)',
      background: 'var(--error-container)',
    }
  }

  return {
    icon: requirement.enviado ? 'pending_actions' : 'upload_file',
    label: requirement.status_label || (requirement.enviado ? 'Pendente de validação' : 'Não enviado'),
    color: 'var(--tertiary)',
    background: 'var(--surface-container-lowest)',
  }
}

export function RequiredDocumentsReviewPanel({
  protocol,
  reviewingRequirementId,
  rejectionReasons,
  onReasonChange,
  onApprove,
  onReject,
  onDownload,
}: Props) {
  const requirements = protocol.protocol_document_requirements || []
  const approvedCount = requirements.filter(item => item.aprovado === true).length

  return (
    <div style={{
      padding: 'var(--space-3)',
      background: 'var(--surface-container-low)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--outline-variant)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Validação documental do Comité Científico
          </p>
          <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
            Após todos os anexos serem aprovados, o protocolo fica disponível para atribuição de revisores no CC.
          </p>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>fact_check</span>
          {approvedCount}/{requirements.length} aprovados
        </span>
      </div>

      {requirements.length === 0 ? (
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
          Nenhum anexo obrigatório foi encontrado para este protocolo.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-2)' }}>
          {requirements.map(requirement => {
            const state = getRequirementState(requirement)
            const isBusy = reviewingRequirementId === requirement.id
            const rejectReason = rejectionReasons[requirement.id] ?? ''
            const canApprove = Boolean(requirement.enviado && requirement.download_url && requirement.aprovado !== true)
            const canReject = Boolean(requirement.enviado && requirement.download_url && rejectReason.trim())

            return (
              <div key={requirement.id} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--outline-variant)',
                background: state.background,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-1)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px', color: state.color }}>{state.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)' }}>{requirement.nome}</p>
                    <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>{state.label}</p>
                    {requirement.file_name && (
                      <button
                        type="button"
                        onClick={() => onDownload(requirement.download_url, requirement.file_name)}
                        disabled={!requirement.download_url}
                        style={{
                          marginTop: '4px',
                          padding: 0,
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--primary)',
                          cursor: requirement.download_url ? 'pointer' : 'not-allowed',
                          fontSize: 'var(--label-sm)',
                          fontWeight: 'var(--font-semibold)',
                          textDecoration: 'underline',
                          textAlign: 'left',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%',
                        }}
                      >
                        {requirement.file_name}
                      </button>
                    )}
                  </div>
                </div>

                {requirement.rejection_reason && (
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                    Motivo anterior: {requirement.rejection_reason}
                  </p>
                )}
                {requirement.aprovado === false && requirement.reviewer && (
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                    Rejeitado por: {requirement.reviewer.name}
                  </p>
                )}

                <textarea
                  value={rejectReason}
                  onChange={event => onReasonChange(requirement.id, event.target.value)}
                  placeholder="Motivo se reprovar este anexo..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--outline-variant)',
                    background: 'var(--surface-container-lowest)',
                    color: 'var(--on-surface)',
                    fontFamily: 'var(--font-family)',
                    fontSize: 'var(--body-sm)',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />

                <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => onDownload(requirement.download_url, requirement.file_name || requirement.nome)}
                    disabled={!requirement.download_url}
                    style={{ opacity: requirement.download_url ? 1 : 0.6, cursor: requirement.download_url ? 'pointer' : 'not-allowed' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                    Baixar
                  </button>
                  <button
                    type="button"
                    className="btn btn-small btn-primary"
                    onClick={() => onApprove(protocol.id, requirement.id)}
                    disabled={isBusy || !canApprove}
                    style={{ opacity: isBusy || !canApprove ? 0.6 : 1, cursor: isBusy || !canApprove ? 'not-allowed' : 'pointer' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{isBusy ? 'hourglass_top' : 'check'}</span>
                    Aprovar
                  </button>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => onReject(protocol.id, requirement.id)}
                    disabled={isBusy || !canReject}
                    style={{
                      opacity: isBusy || !canReject ? 0.6 : 1,
                      cursor: isBusy || !canReject ? 'not-allowed' : 'pointer',
                      border: '1px solid var(--error)',
                      color: 'var(--error)',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{isBusy ? 'hourglass_top' : 'close'}</span>
                    Reprovar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
