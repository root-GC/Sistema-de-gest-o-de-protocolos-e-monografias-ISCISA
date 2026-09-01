import { useEffect, useMemo, useState } from 'react'
import type { Protocol, ProtocolDocumentRequirement } from '../../services/protocolService'
import { createApiFileObjectUrl } from '../../services/apiClient'

type Props = {
  protocol: Protocol
  reviewingRequirementId: number | null
  rejectionReasons: Record<number, string>
  onReasonChange: (requirementId: number, reason: string) => void
  onApprove: (protocolId: number, requirementId: number) => void
  onReject: (protocolId: number, requirementId: number) => void
  onDownload: (url: string | null | undefined, fallbackFilename?: string | null) => void
  organ?: 'comite_cientifico' | 'comite_bioetica'
  title?: string
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
      label: requirement.status_label || 'Não Aprovado',
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

function isAutoParecer(requirement: ProtocolDocumentRequirement): boolean {
  return requirement.document_key === 'parecer_cc_assinado'
}

type PreviewTarget = {
  id: string
  label: string
  url: string | null | undefined
  filename?: string | null
  description: string
}

function PreviewFrame({ target }: { target: PreviewTarget }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [filename, setFilename] = useState<string>(target.filename || 'documento.pdf')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let revokeUrl: (() => void) | null = null

    async function loadPreview() {
      if (!target.url) return

      try {
        const file = await createApiFileObjectUrl(target.url, target.filename || undefined, true)
        if (cancelled) {
          file.revoke()
          return
        }

        revokeUrl = file.revoke
        setObjectUrl(file.objectUrl)
        setFilename(file.filename)
      } catch (previewError) {
        if (!cancelled) {
          setError((previewError as Error).message)
        }
      }
    }

    void loadPreview()

    return () => {
      cancelled = true
      revokeUrl?.()
    }
  }, [target.id, target.url, target.filename])

  if (error) {
    return (
      <div style={{ padding: 'var(--space-3)', color: 'var(--on-error-container)', background: 'var(--error-container)', height: '100%' }}>
        {error}
      </div>
    )
  }

  if (!objectUrl) {
    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        color: 'var(--on-surface-variant)',
        background: 'var(--surface-container-low)',
      }}>
        A carregar pré-visualização...
      </div>
    )
  }

  return (
    <iframe
      title={target.label}
      src={objectUrl}
      data-filename={filename}
      style={{
        width: '100%',
        height: '100%',
        border: 0,
        background: 'white',
      }}
    />
  )
}

export function RequiredDocumentsReviewPanel({
  protocol,
  reviewingRequirementId,
  rejectionReasons,
  onReasonChange,
  onApprove,
  onReject,
  onDownload,
  organ = 'comite_cientifico',
  title,
}: Props) {
  const allRequirements = useMemo(() => protocol.protocol_document_requirements || [], [protocol.protocol_document_requirements])
  const requirements = useMemo(
    () => allRequirements.filter(item => item.required_for_organ === organ),
    [allRequirements, organ],
  )
  const [selectedRequirementId, setSelectedRequirementId] = useState<number | null>(null)
  const [modalTarget, setModalTarget] = useState<PreviewTarget | null>(null)
  const approvedCount = requirements.filter(item => item.aprovado === true).length
  const isBioethics = organ === 'comite_bioetica'
  const panelTitle = title ?? (isBioethics
    ? 'Validação documental do Comité de Bioética'
    : 'Validação documental do Comité Científico')
  const panelDescription = isBioethics
    ? 'Após todos os anexos do CIBS serem aprovados, o protocolo fica disponível para atribuição de revisores no Comité de Bioética.'
    : 'Após todos os anexos serem aprovados, o protocolo fica disponível para atribuição de revisores no CC.'

  const activeRequirementId = selectedRequirementId ?? requirements[0]?.id ?? null
  const selectedRequirement = requirements.find(item => item.id === activeRequirementId) ?? null
  const selectedPreviewTarget: PreviewTarget | null = (() => {
    if (selectedRequirement?.download_url) {
      return {
        id: `requirement-${selectedRequirement.id}`,
        label: selectedRequirement.nome,
        url: selectedRequirement.download_url,
        filename: selectedRequirement.file_name || selectedRequirement.nome,
        description: selectedRequirement.status_label || (selectedRequirement.enviado ? 'Documento enviado' : 'Ainda não enviado'),
      }
    }

    if (protocol.latest_document?.download_url) {
      return {
        id: 'protocol',
        label: 'Protocolo',
        url: protocol.latest_document.download_url,
        filename: protocol.latest_document.file_name || `protocolo-${protocol.code}.pdf`,
        description: 'Pré-visualização do documento principal submetido.',
      }
    }

    return null
  })()

  const isAutoParecerSelected = selectedRequirement ? isAutoParecer(selectedRequirement) : false

  const detailPanel = selectedRequirement ? (() => {
    const isBusy = reviewingRequirementId === selectedRequirement.id
    const rejectReason = rejectionReasons[selectedRequirement.id] ?? ''
    const canApprove = Boolean(selectedRequirement.enviado && selectedRequirement.download_url && selectedRequirement.aprovado !== true)
    const canReject = Boolean(selectedRequirement.enviado && selectedRequirement.download_url && rejectReason.trim())

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        padding: 'var(--space-2) 0 0',
        borderTop: '1px solid var(--outline-variant)',
      }}>
        {selectedRequirement.rejection_reason && (
          <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--error-container)', color: 'var(--on-error-container)', border: '1px solid var(--error)' }}>
            <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Motivo anterior
            </p>
            <p style={{ marginTop: '4px', fontSize: 'var(--body-sm)' }}>
              {selectedRequirement.rejection_reason}
            </p>
          </div>
        )}

        {selectedRequirement.aprovado === false && selectedRequirement.reviewer && !isAutoParecerSelected && (
          <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
            Não aprovado por: {selectedRequirement.reviewer.name}
          </p>
        )}

        {selectedRequirement.aprovado === true ? (
          <p style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--body-sm)', color: 'var(--primary)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified</span>
            {isAutoParecerSelected ? 'Parecer confirmado pelo Comité de Bioética.' : 'Este anexo já foi aprovado.'}
          </p>
        ) : isAutoParecerSelected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)' }}>
              Este parecer foi gerado e assinado automaticamente pela secretaria. O Comité de Bioética apenas confirma a receção e leitura do parecer assinado do Comité Científico.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-small btn-primary"
                onClick={() => onApprove(protocol.id, selectedRequirement.id)}
                disabled={isBusy || !canApprove}
                style={{ opacity: isBusy || !canApprove ? 0.6 : 1, cursor: isBusy || !canApprove ? 'not-allowed' : 'pointer' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{isBusy ? 'hourglass_top' : 'verified'}</span>
                {isBusy ? 'A confirmar...' : 'Confirmar'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor={`reject-reason-${selectedRequirement.id}`} style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Motivo para não aprovar
              </label>
              <textarea
                id={`reject-reason-${selectedRequirement.id}`}
                value={rejectReason}
                onChange={event => onReasonChange(selectedRequirement.id, event.target.value)}
                placeholder="Explique de forma objetiva o que deve ser corrigido..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--outline-variant)',
                  background: 'var(--surface-container-lowest)',
                  color: 'var(--on-surface)',
                  fontFamily: 'var(--font-family)',
                  fontSize: 'var(--body-sm)',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                O motivo é obrigatório quando clicar em “Não aprovar”.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-small btn-primary"
                onClick={() => onApprove(protocol.id, selectedRequirement.id)}
                disabled={isBusy || !canApprove}
                style={{ opacity: isBusy || !canApprove ? 0.6 : 1, cursor: isBusy || !canApprove ? 'not-allowed' : 'pointer' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{isBusy ? 'hourglass_top' : 'check_circle'}</span>
                Aprovar
              </button>
              <button
                type="button"
                className="btn btn-small"
                onClick={() => onReject(protocol.id, selectedRequirement.id)}
                disabled={isBusy || !canReject}
                style={{
                  opacity: isBusy || !canReject ? 0.6 : 1,
                  cursor: isBusy || !canReject ? 'not-allowed' : 'pointer',
                  border: '1px solid var(--error)',
                  color: 'var(--error)',
                  background: 'var(--surface-container-lowest)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{isBusy ? 'hourglass_top' : 'cancel'}</span>
                Não aprovar
              </button>
            </div>
          </>
        )}
      </div>
    )
  })() : null

  return (
    <>
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
            {panelTitle}
          </p>
          <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
            {panelDescription}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) minmax(0, 1fr)', gap: 'var(--space-3)', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--outline-variant)',
                  background: 'var(--surface-container-low)',
                }}>
                  {requirements.map(requirement => {
                    const state = getRequirementState(requirement)
                    const isActive = selectedRequirement?.id === requirement.id

                    return (
                      <button
                        key={requirement.id}
                        type="button"
                        onClick={() => setSelectedRequirementId(requirement.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 'var(--space-2)',
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-lg)',
                        border: isActive ? '1px solid var(--primary)' : '1px solid var(--outline-variant)',
                        background: isActive ? 'var(--primary-container)' : 'var(--surface-container-lowest)',
                        color: isActive ? 'var(--on-primary-container)' : 'var(--on-surface)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: isActive ? '0 0 0 1px var(--primary)' : 'none',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: isActive ? 'var(--on-primary-container)' : state.color }}>
                        {state.icon}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 'var(--font-semibold)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {requirement.nome}
                          {requirement.is_optional && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 8px', borderRadius: 'var(--radius-full)', background: 'var(--surface-container)', color: 'var(--on-surface-variant)', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-medium)' }}>
                              Opcional
                            </span>
                          )}
                        </p>
                        <p style={{ fontSize: 'var(--label-sm)', color: isActive ? 'var(--on-primary-container)' : 'var(--on-surface-variant)' }}>
                          {state.label}
                        </p>
                        <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: state.background,
                            color: state.color,
                            fontSize: 'var(--label-sm)',
                            fontWeight: 'var(--font-semibold)',
                          }}>
                            {requirement.aprovado === true ? 'Aprovado' : requirement.aprovado === false ? 'Não aprovado' : requirement.enviado ? 'Pendente' : 'A enviar'}
                          </span>
                          {requirement.file_name && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--surface-container)',
                              color: 'var(--on-surface-variant)',
                              fontSize: 'var(--label-sm)',
                            }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>attach_file</span>
                              {requirement.file_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}>
              <div style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--outline-variant)',
                background: 'var(--surface-container-lowest)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Preview
                    </p>
                    <h3 style={{ marginTop: '4px', fontSize: 'var(--title-md)', color: 'var(--on-surface)', fontWeight: 'var(--font-semibold)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedPreviewTarget?.label || 'Pré-visualização indisponível'}
                      {selectedRequirement?.is_optional && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 8px', borderRadius: 'var(--radius-full)', background: 'var(--surface-container)', color: 'var(--on-surface-variant)', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-medium)' }}>
                          Opcional
                        </span>
                      )}
                    </h3>
                    {selectedRequirement?.file_name && (
                      <p style={{ marginTop: '2px', fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                        {selectedRequirement.file_name}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {selectedRequirement && (() => {
                      const reqState = getRequirementState(selectedRequirement)
                      const reqStatus = selectedRequirement.aprovado === true
                        ? 'Aprovado'
                        : selectedRequirement.aprovado === false
                          ? 'Não aprovado'
                          : selectedRequirement.enviado
                            ? 'Pendente de validação'
                            : 'Aguardando envio'

                      return (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: 'var(--radius-full)',
                          background: reqState.background,
                          color: reqState.color,
                          fontSize: 'var(--label-md)',
                          fontWeight: 'var(--font-semibold)',
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{reqState.icon}</span>
                          {reqStatus}
                        </span>
                      )
                    })()}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--surface-container)',
                      color: 'var(--on-surface-variant)',
                      fontSize: 'var(--label-md)',
                      fontWeight: 'var(--font-semibold)',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>picture_as_pdf</span>
                      PDF
                    </span>
                    {selectedRequirement && (
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() => onDownload(selectedRequirement.download_url, selectedRequirement.file_name || selectedRequirement.nome)}
                        disabled={!selectedRequirement.download_url}
                        style={{ opacity: selectedRequirement.download_url ? 1 : 0.6, cursor: selectedRequirement.download_url ? 'pointer' : 'not-allowed' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                        Baixar
                      </button>
                    )}
                    {selectedPreviewTarget?.url && (
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() => setModalTarget(selectedPreviewTarget)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                        Abrir
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--outline-variant)' }} />

                <div style={{
                  position: 'relative',
                  flex: 1,
                  minHeight: '560px',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: '1px solid var(--outline-variant)',
                  background: 'var(--surface-container-low)',
                }}>
                  {selectedPreviewTarget?.url ? (
                    <PreviewFrame key={selectedPreviewTarget.id} target={selectedPreviewTarget} />
                  ) : (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      padding: 'var(--space-3)',
                      textAlign: 'center',
                      color: 'var(--on-surface-variant)',
                      background: 'var(--surface-container-low)',
                    }}>
                      <div>
                        <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)' }}>
                          {selectedPreviewTarget?.label || 'Pré-visualização indisponível'}
                        </p>
                        <p style={{ marginTop: '4px' }}>
                          Nenhum ficheiro PDF disponível para este item.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {detailPanel}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {modalTarget && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={modalTarget.label}
        onClick={() => setModalTarget(null)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-4)',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(2px)',
        }}
      >
        <div
          onClick={event => event.stopPropagation()}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            width: 'min(1100px, 100%)',
            height: 'min(85vh, 900px)',
            background: 'var(--surface-container-lowest)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--outline-variant)',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', borderBottom: '1px solid var(--outline-variant)' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {modalTarget.description}
              </p>
              <h3 style={{ marginTop: '2px', fontSize: 'var(--title-md)', color: 'var(--on-surface)', fontWeight: 'var(--font-semibold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {modalTarget.label}
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <button
                type="button"
                className="btn btn-small"
                onClick={() => onDownload(modalTarget.url, modalTarget.filename)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                Baixar
              </button>
              <button
                type="button"
                className="btn btn-small"
                onClick={() => setModalTarget(null)}
                aria-label="Fechar"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                Fechar
              </button>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <PreviewFrame key={modalTarget.id} target={modalTarget} />
          </div>
          {selectedRequirement && modalTarget.id === `requirement-${selectedRequirement.id}` && (() => {
            const isBusy = reviewingRequirementId === selectedRequirement.id
            const rejectReason = rejectionReasons[selectedRequirement.id] ?? ''
            const canApprove = Boolean(selectedRequirement.enviado && selectedRequirement.download_url && selectedRequirement.aprovado !== true)
            const canReject = Boolean(selectedRequirement.enviado && selectedRequirement.download_url && rejectReason.trim())

            if (selectedRequirement.aprovado === true) {
              return (
                <div style={{ padding: 'var(--space-2) var(--space-3)', borderTop: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--body-sm)', color: 'var(--primary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified</span>
                  {isAutoParecerSelected ? 'Parecer confirmado pelo Comité de Bioética.' : 'Este anexo já foi aprovado.'}
                </div>
              )
            }

            if (isAutoParecerSelected) {
              return (
                <div style={{ padding: 'var(--space-2) var(--space-3)', borderTop: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                    Parecer gerado e assinado pela secretaria. Apenas confirmação.
                  </span>
                  <button
                    type="button"
                    className="btn btn-small btn-primary"
                    onClick={() => onApprove(protocol.id, selectedRequirement.id)}
                    disabled={isBusy || !canApprove}
                    style={{ opacity: isBusy || !canApprove ? 0.6 : 1, cursor: isBusy || !canApprove ? 'not-allowed' : 'pointer' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{isBusy ? 'hourglass_top' : 'verified'}</span>
                    {isBusy ? 'A confirmar...' : 'Confirmar'}
                  </button>
                </div>
              )
            }

            return (
              <div style={{ padding: 'var(--space-2) var(--space-3)', borderTop: '1px solid var(--outline-variant)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <label htmlFor={`modal-reject-reason-${selectedRequirement.id}`} style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Motivo para não aprovar
                </label>
                <textarea
                  id={`modal-reject-reason-${selectedRequirement.id}`}
                  value={rejectReason}
                  onChange={event => onReasonChange(selectedRequirement.id, event.target.value)}
                  placeholder="Explique de forma objetiva o que deve ser corrigido..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--outline-variant)',
                    background: 'var(--surface-container-lowest)',
                    color: 'var(--on-surface)',
                    fontFamily: 'var(--font-family)',
                    fontSize: 'var(--body-sm)',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-small btn-primary"
                    onClick={() => onApprove(protocol.id, selectedRequirement.id)}
                    disabled={isBusy || !canApprove}
                    style={{ opacity: isBusy || !canApprove ? 0.6 : 1, cursor: isBusy || !canApprove ? 'not-allowed' : 'pointer' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{isBusy ? 'hourglass_top' : 'check_circle'}</span>
                    Aprovar
                  </button>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => onReject(protocol.id, selectedRequirement.id)}
                    disabled={isBusy || !canReject}
                    style={{
                      opacity: isBusy || !canReject ? 0.6 : 1,
                      cursor: isBusy || !canReject ? 'not-allowed' : 'pointer',
                      border: '1px solid var(--error)',
                      color: 'var(--error)',
                      background: 'var(--surface-container-lowest)',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{isBusy ? 'hourglass_top' : 'cancel'}</span>
                    Não aprovar
                  </button>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    )}
    </>
  )
}
