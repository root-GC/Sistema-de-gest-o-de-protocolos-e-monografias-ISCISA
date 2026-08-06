// src/pages/student/ProtocolPage.tsx
import { useEffect, useState } from 'react'
import {
  CC_REQUIRED_DOCUMENTS,
  CIBS_REQUIRED_DOCUMENTS,
  OPTIONAL_DOCUMENTS,
  protocolService,
  type CCRequiredDocumentFiles,
  type CCRequiredDocumentKey,
  type CIBSDocumentFiles,
  type CIBSDocumentKey,
  type OtherDocument,
  type Document,
  type Protocol,
  type ProtocolDocumentRequirement,
  type ProtocolOpinion,
} from '../../services/protocolService'
import { topicService, type ApprovedTopic } from '../../services/topicService'
import { TopicJustificationToggle } from '../../components/TopicJustification'
import PdfPreviewModal from '../../components/PdfPreviewModal'
import '../../styles/global.css'

// ============================================================
// HELPERS
// ============================================================
function getStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    protocol_submitted: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Submetido' },
    protocol_pending_supervisor: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Pendente (Supervisor)' },
    protocol_approved_supervisor: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)', dot: 'var(--primary)', label: 'Aprovado (Supervisor)' },
    protocol_rejected_supervisor: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Não Aprovado (Supervisor)' },
    protocol_in_review: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Em Revisão' },
    protocol_approved_nucleo: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)', dot: 'var(--primary)', label: 'Aprovado (Núcleo)' },
    protocol_rejected_nucleo: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Não Aprovado (Núcleo)' },
    protocol_documents_pending_cc: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Anexos em validação (CC)' },
    protocol_documents_pending_cibs: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Anexos em validação (CIBS)' },
    protocol_pending_comite_cientifico: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Encaminhado ao CC' },
    protocol_rejected_cc: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Não Aprovado (CC)' },
    protocol_rejected_bioetica: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Não Aprovado (Bioética)' },
    protocol_approved_final: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)', dot: 'var(--primary)', label: 'Aprovado final' },
    protocol_rejected_final: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Não Aprovado final' },
    protocol_resubmitted: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Re-submetido' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validateAttachmentPdf(file: File | null): string | null {
  if (!file) return null

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) return 'Os anexos devem ser ficheiros em formato PDF.'

  if (file.size > 10 * 1024 * 1024) return 'Cada anexo não pode exceder 10 MB.'

  return null
}

function emptyRequiredDocuments(): CCRequiredDocumentFiles {
  return Object.fromEntries(CC_REQUIRED_DOCUMENTS.map(doc => [doc.key, null])) as CCRequiredDocumentFiles
}

function emptyCIBSDocuments(): CIBSDocumentFiles {
  return Object.fromEntries(CIBS_REQUIRED_DOCUMENTS.map(doc => [doc.key, null])) as CIBSDocumentFiles
}

function getDocumentVersionLabel(doc: Pick<Document, 'version' | 'version_label' | 'status'>, protocolVersion?: string | null) {
  if (doc.version_label) {
    return doc.version_label
  }

  if (doc.status === 'active' && protocolVersion && protocolVersion !== 'APROVADO') {
    return protocolVersion
  }

  return `V${doc.version}`
}

function getRequirementValidationState(requirement: ProtocolDocumentRequirement) {
  if (requirement.aprovado === true) {
    return {
      icon: 'check_circle',
      label: requirement.status_label || 'Aprovado',
      color: 'var(--primary)',
      background: 'var(--primary-container)',
      border: 'var(--primary)',
    }
  }

  if (requirement.aprovado === false) {
    return {
      icon: 'cancel',
      label: requirement.status_label || 'Não aprovado',
      color: 'var(--error)',
      background: 'var(--error-container)',
      border: 'var(--error)',
    }
  }

  if (requirement.enviado) {
    return {
      icon: 'pending_actions',
      label: requirement.status_label || 'Pendente de validação',
      color: 'var(--tertiary)',
      background: 'var(--tertiary-fixed)',
      border: 'var(--tertiary)',
    }
  }

  return {
    icon: 'upload_file',
    label: requirement.status_label || 'Não enviado',
    color: 'var(--outline)',
    background: 'var(--surface-container-lowest)',
    border: 'var(--outline-variant)',
  }
}

function getRequirementUploadState(attachment: File | null, previousRequirement?: ProtocolDocumentRequirement) {
  if (attachment) {
    return {
      icon: previousRequirement?.aprovado === false ? 'published_with_changes' : 'check_circle',
      label: previousRequirement?.file_name ? 'Novo ficheiro' : 'Selecionado',
      helper: previousRequirement?.aprovado === false ? 'Substitui anexo não aprovado' : 'Pronto para submissão',
      color: 'var(--primary)',
      background: 'var(--primary-container)',
      border: 'var(--primary)',
    }
  }

  if (previousRequirement?.file_name) {
    if (previousRequirement.aprovado === true) {
      return {
        icon: 'verified',
        label: 'Aprovado anteriormente',
        helper: 'Será reutilizado nesta versão',
        color: 'var(--primary)',
        background: 'var(--surface-container-low)',
        border: 'var(--primary)',
      }
    }

    if (previousRequirement.aprovado === false) {
      return {
        icon: 'cancel',
        label: 'Não aprovado anteriormente',
        helper: 'Pode substituir antes de submeter',
        color: 'var(--error)',
        background: 'var(--error-container)',
        border: 'var(--error)',
      }
    }

    return {
      icon: 'history',
      label: 'Reutilizado',
      helper: 'Já existe um ficheiro carregado',
      color: 'var(--tertiary)',
      background: 'var(--surface-container-low)',
      border: 'var(--tertiary)',
    }
  }

  return {
    icon: 'upload_file',
    label: 'Não enviado',
    helper: 'Apenas PDF até 10 MB',
    color: 'var(--outline)',
    background: 'var(--surface-container-lowest)',
    border: 'var(--outline-variant)',
  }
}

function SummaryRow(props: {
  name: string
  fileLabel: string
  hasFile: boolean
  icon: string
  color: string
  label: string
  tone?: 'error' | 'neutral'
}) {
  const { name, fileLabel, hasFile, icon, color, label, tone = 'error' } = props
  const missingStyle = tone === 'error'
    ? { background: 'var(--error-container)', border: '1px solid var(--error)' }
    : { background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', padding: '10px 12px', borderRadius: 'var(--radius-md)', background: hasFile ? 'var(--surface-container-low)' : missingStyle.background, border: hasFile ? '1px solid var(--outline-variant)' : missingStyle.border, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'flex-start', flex: '1 1 260px', minWidth: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color }}>{icon}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)' }}>{name}</p>
          <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileLabel}</p>
        </div>
      </div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-lowest)', color, fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)', whiteSpace: 'nowrap' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{icon}</span>
        {label}
      </span>
    </div>
  )
}

function SummaryGroupLabel(props: { children: string }) {
  return (
    <p style={{ fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0', padding: '4px 2px' }}>
      {props.children}
    </p>
  )
}

function RequirementValidationRow(props: {
  req: ProtocolDocumentRequirement
  isFirst: boolean
  uploading: boolean
  onDownload: (req: ProtocolDocumentRequirement) => void
  onReupload: (protocolId: number, reqId: number, file: File | null) => void
}) {
  const { req, isFirst, uploading, onDownload, onReupload } = props
  const rejected = req.aprovado === false
  const state = getRequirementValidationState(req)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', padding: '12px var(--space-3)', background: state.background, borderTop: isFirst ? 'none' : '1px solid var(--outline-variant)', borderLeft: `4px solid ${state.border}`, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: '1 1 320px', minWidth: 0 }}>
        <span className="material-symbols-outlined" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.55)', color: state.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
          {state.icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', marginBottom: '2px' }}>{req.nome}</p>
            {req.is_optional && (
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 8px', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-medium)' }}>
                Opcional
              </span>
            )}
          </div>
          <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {req.file_name || 'Nenhum ficheiro carregado'}
          </p>
          {(req.rejection_reason || (rejected && req.reviewer)) && (
            <p style={{ fontSize: 'var(--label-sm)', color: rejected ? 'var(--on-error-container)' : 'var(--on-surface-variant)', marginTop: '4px' }}>
              {rejected && req.reviewer ? `Não Aprovado por: ${req.reviewer.name}` : null}
              {rejected && req.reviewer && req.rejection_reason ? ' • ' : null}
              {req.rejection_reason ? `Motivo: ${req.rejection_reason}` : null}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.55)', color: state.color, fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)', whiteSpace: 'nowrap' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{state.icon}</span>
          {state.label}
        </span>
        {req.download_url && (
          <button type="button" onClick={() => onDownload(req)} className="btn btn-small">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>Baixar
          </button>
        )}
        {rejected && (
          <label className="btn btn-small" style={{ cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload</span>
            {uploading ? 'A enviar...' : 'Reenviar'}
            <input
              type="file"
              accept=".pdf,application/pdf"
              disabled={uploading}
              onChange={e => onReupload(req.protocol_id, req.id, e.target.files?.[0] ?? null)}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </div>
    </div>
  )
}

function DocumentUploadRow(props: {
  doc: { key: string; name: string }
  attachment: File | null
  previousRequirement?: ProtocolDocumentRequirement
  onAttach: (file: File | null) => void
  first?: boolean
}) {
  const { doc, attachment, previousRequirement, onAttach, first } = props
  const state = getRequirementUploadState(attachment, previousRequirement)
  const hasFile = Boolean(attachment || previousRequirement?.file_name)
  const fileLabel = attachment
    ? `${attachment.name} (${formatFileSize(attachment.size)})`
    : previousRequirement?.file_name || 'Nenhum ficheiro carregado'

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', padding: '14px var(--space-3)', borderTop: first ? 'none' : '1px dashed var(--outline-variant)', borderLeft: `4px solid ${state.border}`, background: state.background, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: '1 1 360px', minWidth: 0 }}>
        <span className="material-symbols-outlined" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-lg)', background: hasFile ? 'rgba(255,255,255,0.55)' : 'var(--surface-container-low)', color: state.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
          {state.icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', marginBottom: '2px' }}>{doc.name}</p>
          <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {fileLabel}
          </p>
          {(state.helper || previousRequirement?.rejection_reason || (previousRequirement?.aprovado === false && previousRequirement?.reviewer)) && (
            <p style={{ fontSize: 'var(--label-sm)', color: previousRequirement?.aprovado === false && !attachment ? 'var(--on-error-container)' : 'var(--on-surface-variant)', marginTop: '4px' }}>
              {state.helper}
              {previousRequirement?.aprovado === false && previousRequirement?.reviewer ? ` • Não Aprovado por: ${previousRequirement.reviewer.name}` : null}
              {previousRequirement?.rejection_reason ? ` • Motivo: ${previousRequirement.rejection_reason}` : null}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.55)', color: state.color, fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)', whiteSpace: 'nowrap' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{state.icon}</span>
          {state.label}
        </span>
        <label className="btn btn-small" style={{ cursor: 'pointer' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{hasFile ? 'sync' : 'attach_file'}</span>
          {hasFile ? 'Trocar' : 'Anexar'}
          <input type="file" accept=".pdf,application/pdf" onChange={e => onAttach(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
        </label>
        {attachment && (
          <button type="button" className="btn btn-small" onClick={() => onAttach(null)}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            Remover
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE
// ============================================================
export default function ProtocolPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [opinionsByProtocol, setOpinionsByProtocol] = useState<Record<number, ProtocolOpinion[]>>({})
  const [pdfPreview, setPdfPreview] = useState<{ url: string; title: string; filename: string } | null>(null)
  const [approvedTopics, setApprovedTopics] = useState<ApprovedTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [protocolType, setProtocolType] = useState('protocol')
  const [file, setFile] = useState<File | null>(null)
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1)
  const [requiredDocuments, setRequiredDocuments] = useState<CCRequiredDocumentFiles>(() => emptyRequiredDocuments())
  const [cibsDocuments, setCibsDocuments] = useState<CIBSDocumentFiles>(() => emptyCIBSDocuments())
  const [otherDocuments, setOtherDocuments] = useState<OtherDocument[]>(() =>
    OPTIONAL_DOCUMENTS.map(option => ({ name: option.name, file: null }))
  )
  const [submitting, setSubmitting] = useState(false)
  const [uploadingRequirementId, setUploadingRequirementId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    load()
    loadApprovedTopics()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const { protocols } = await protocolService.list()
      setProtocols(protocols)

      const opinionEntries = await Promise.all(
        protocols.map(async protocol => {
          try {
            const { opinions } = await protocolService.listOpinions(protocol.id)
            return [protocol.id, opinions] as const
          } catch {
            return [protocol.id, []] as const
          }
        })
      )

      setOpinionsByProtocol(Object.fromEntries(opinionEntries))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function loadApprovedTopics() {
    setLoadingTopics(true)
    try {
      const response = await topicService.getMyApprovedTopics()
      const topics = response.data || []
      setApprovedTopics(topics)
    } catch (e) {
      console.error('Erro ao carregar temas aprovados:', e)
      setApprovedTopics([])
    } finally {
      setLoadingTopics(false)
    }
  }

  const current = protocols[0]
  const canSubmitNew = !current || [
    'protocol_rejected_supervisor',
    'protocol_rejected_nucleo',
    'protocol_rejected_cc',
    'protocol_rejected_bioetica',
    'protocol_rejected_final',
  ].includes(current.status)

  const selectedTopic = approvedTopics.find(t => t.id === Number(selectedTopicId))
  const selectedProtocol = selectedTopic?.latest_protocol_id
    ? protocols.find(protocol => protocol.id === selectedTopic.latest_protocol_id)
    : undefined
  const selectedProtocolRequirementsByKey = (selectedProtocol?.protocol_document_requirements ?? [])
    .reduce((acc, requirement) => {
      acc[requirement.document_key] = requirement
      return acc
    }, {} as Record<string, ProtocolDocumentRequirement>)
  const isResubmission = Boolean(selectedTopic?.can_resubmit_protocol && selectedProtocol)
  const topicHasActiveProtocol = Boolean(selectedTopic?.has_protocol && !selectedTopic?.can_resubmit_protocol)
  const protocolStepComplete = Boolean(selectedTopicId && file && !topicHasActiveProtocol)
  const requiredDocumentsComplete = CC_REQUIRED_DOCUMENTS.every(doc => Boolean(
    requiredDocuments[doc.key] || (isResubmission && selectedProtocolRequirementsByKey[doc.key]?.file_name)
  ))
  const reusedRequiredDocuments = CC_REQUIRED_DOCUMENTS.filter(doc => (
    !requiredDocuments[doc.key] && Boolean(selectedProtocolRequirementsByKey[doc.key]?.file_name)
  ))
  const requiredDocumentUploadRows = CC_REQUIRED_DOCUMENTS.map(doc => {
    const attachment = requiredDocuments[doc.key]
    const previousRequirement = selectedProtocolRequirementsByKey[doc.key]

    return {
      doc,
      attachment,
      previousRequirement,
      state: getRequirementUploadState(attachment, previousRequirement),
    }
  })
  const selectedRequiredDocumentsCount = requiredDocumentUploadRows.filter(row => Boolean(row.attachment)).length
  const readyRequiredDocumentsCount = requiredDocumentUploadRows.filter(row => Boolean(row.attachment || row.previousRequirement?.file_name)).length
  const rejectedPreviousDocumentsCount = requiredDocumentUploadRows.filter(row => !row.attachment && row.previousRequirement?.aprovado === false).length

  const cibsDocumentUploadRows = CIBS_REQUIRED_DOCUMENTS.map(doc => {
    const attachment = cibsDocuments[doc.key]
    const previousRequirement = selectedProtocolRequirementsByKey[doc.key]

    return {
      doc,
      attachment,
      previousRequirement,
      state: getRequirementUploadState(attachment, previousRequirement),
    }
  })
  const cibsDocumentsComplete = CIBS_REQUIRED_DOCUMENTS.every(doc => Boolean(
    cibsDocuments[doc.key] || (isResubmission && selectedProtocolRequirementsByKey[doc.key]?.file_name)
  ))
  const readyCIBSDocumentsCount = cibsDocumentUploadRows.filter(row => Boolean(row.attachment || row.previousRequirement?.file_name)).length
  const reusedCIBSDocuments = CIBS_REQUIRED_DOCUMENTS.filter(doc => (
    !cibsDocuments[doc.key] && Boolean(selectedProtocolRequirementsByKey[doc.key]?.file_name)
  ))

  const otherDocumentRows = otherDocuments
  const readyOtherDocumentsCount = otherDocuments.filter(other => Boolean(other.file)).length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !selectedTopicId || !requiredDocumentsComplete || !cibsDocumentsComplete) return

    if (topicHasActiveProtocol) {
      setError('Este tema já possui um protocolo ativo.')
      return
    }

    const attachments = [
      ...Object.values(requiredDocuments),
      ...Object.values(cibsDocuments),
      ...otherDocuments.map(other => other.file),
    ].filter((f): f is File => Boolean(f))

    const invalidReason = attachments.reduce<string | null>((reason, f) => reason ?? validateAttachmentPdf(f), null)

    if (invalidReason) {
      setError(invalidReason)
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      await protocolService.submit(Number(selectedTopicId), protocolType, file, requiredDocuments, cibsDocuments, otherDocuments)
      setFile(null)
      setSelectedTopicId('')
      setRequiredDocuments(emptyRequiredDocuments())
      setCibsDocuments(emptyCIBSDocuments())
      setOtherDocuments([])
      setFormStep(1)
      setSuccess(isResubmission
        ? 'Protocolo ressubmetido com sucesso. Aguarda autorização do supervisor.'
        : 'Protocolo e anexos submetidos com sucesso. Aguarda autorização do supervisor.')
      await load()
      await loadApprovedTopics()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const e = err as Error & { status?: number }
      if (e.status === 409) {
        setError('Já existe um protocolo activo para este tema.')
      } else {
        setError(e.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  function setRequiredDocument(key: CCRequiredDocumentKey, attachment: File | null) {
    const validationError = validateAttachmentPdf(attachment)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setRequiredDocuments(prev => ({ ...prev, [key]: attachment }))
  }

  function setCIBSDocument(key: CIBSDocumentKey, attachment: File | null) {
    const validationError = validateAttachmentPdf(attachment)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setCibsDocuments(prev => ({ ...prev, [key]: attachment }))
  }

  function setOtherDocument(index: number, patch: Partial<OtherDocument>) {
    if (patch.file !== undefined) {
      const validationError = validateAttachmentPdf(patch.file ?? null)
      if (validationError) {
        setError(validationError)
        return
      }
      setError(null)
    }
    setOtherDocuments(prev => prev.map((other, i) => (i === index ? { ...other, ...patch } : other)))
  }

  async function reuploadRequirement(protocolId: number, requirementId: number, attachment: File | null) {
    if (!attachment) return

    const validationError = validateAttachmentPdf(attachment)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploadingRequirementId(requirementId)
    setError(null)
    setSuccess(null)
    try {
      await protocolService.uploadRequiredDocument(protocolId, requirementId, attachment)
      setSuccess('Anexo reenviado com sucesso.')
      await load()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploadingRequirementId(null)
    }
  }

  async function openFile(url: string | null | undefined, fallbackFilename?: string) {
    if (!url) return
    try {
      await protocolService.openFile(url, fallbackFilename)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function downloadFile(url: string | null | undefined, fallbackFilename?: string) {
    if (!url) return
    try {
      await protocolService.downloadFile(url, fallbackFilename)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function previewPdf(url: string | null | undefined, title: string, filename: string) {
    if (!url) return
    setPdfPreview({ url, title, filename })
  }

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '60vh', fontFamily: 'var(--font-family)',
        color: 'var(--on-surface-variant)', fontSize: 'var(--body-lg)', gap: 'var(--space-2)'
      }}>
        <span style={{ width: '24px', height: '24px', border: '3px solid var(--outline-variant)', borderTopColor: 'var(--primary)', borderRadius: 'var(--radius-full)', animation: 'spin 0.8s linear infinite' }} />
        A carregar...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', marginBottom: 'var(--space-1)' }}>
            O meu protocolo
          </h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            Submeta e acompanhe o seu protocolo de investigação.
          </p>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>description</span>
          {protocols.length} protocolo{protocols.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Mensagem de sucesso */}
      {success && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', background: 'var(--primary-container)', color: 'var(--on-primary-container)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-4)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
          {success}
        </div>
      )}

      {/* Erro */}
      {error && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', background: 'var(--error-container)', color: 'var(--on-error-container)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-4)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
          {error}
        </div>
      )}

      {/* Lista de protocolos */}
      {protocols.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          {protocols.map(p => {
            const s = getStatusStyle(p.status)
            const activeDocs = p.documents?.filter(d => d.status === 'active') || []
            const historicalDocs = p.documents?.filter(d => d.status !== 'active') || []
            const opinions = opinionsByProtocol[p.id] || []
            const opinionsByVersion = opinions.reduce((acc, opinion) => {
              if (!acc[opinion.version]) {
                acc[opinion.version] = opinion
              }
              return acc
            }, {} as Record<string, ProtocolOpinion>)

            return (
              <div key={p.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-bold)', color: 'var(--on-surface)', fontFamily: 'var(--font-family)' }}>
                        {p.code}
                      </h3>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: s.dot }} />
                        {p.status_label || s.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>
                      Submissão nº{p.submission_number} • Versão {p.version}
                    </p>
                    {p.topic && (
                      <>
                        <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
                          Tema: {p.topic.title}
                        </p>
                        <TopicJustificationToggle justification={p.topic.justification} showEmpty compact style={{ marginTop: 'var(--space-2)' }} />
                      </>
                    )}
                  </div>
                </div>

                {p.justification && (
                  <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-1)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--tertiary)', flexShrink: 0, marginTop: '2px' }}>info</span>
                    <span>{p.justification}</span>
                  </div>
                )}

                {activeDocs.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                        Documento atual
                      </p>
                      {p.submission_number > 1 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-medium)', background: 'var(--primary-container)', color: 'var(--on-primary-container)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>star</span>
                          Versão atual
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-2)' }}>
                      {activeDocs.map(doc => (
                        <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '10px 12px', background: 'var(--primary-container)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--primary)', fontSize: 'var(--body-sm)', color: 'var(--on-surface)', fontWeight: 'var(--font-medium)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>description</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <button type="button" onClick={() => downloadFile(doc.download_url, doc.file_name)} disabled={!doc.download_url} style={{ background: 'transparent', border: 'none', padding: 0, margin: 0, color: 'var(--primary)', textAlign: 'left', fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', cursor: doc.download_url ? 'pointer' : 'not-allowed', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '6px', maxWidth: '100%' }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</span>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                            </button>
                            <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: 0 }}>Versão {getDocumentVersionLabel(doc, p.version)}</p>
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => openFile(doc.download_url, doc.file_name)} disabled={!doc.download_url} className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px var(--space-2)', fontSize: 'var(--label-sm)', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', cursor: doc.download_url ? 'pointer' : 'not-allowed', fontWeight: 'var(--font-medium)' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>Ver
                            </button>
                            {doc.download_url && (
                              <button type="button" onClick={() => downloadFile(doc.download_url, doc.file_name)} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px var(--space-2)', fontSize: 'var(--label-sm)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'var(--font-medium)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>Baixar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {historicalDocs.length > 0 && (
                  <details style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--outline-variant)' }}>
                    <summary style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', cursor: 'pointer', fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>history</span>
                      Histórico de versões
                      <span style={{ marginLeft: 'auto', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-medium)' }}>
                        {historicalDocs.length} ficheiro{historicalDocs.length !== 1 ? 's' : ''}
                      </span>
                    </summary>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      {historicalDocs.map(doc => {
                        const versionLabel = getDocumentVersionLabel(doc, p.version)
                        const opinion = opinionsByVersion[versionLabel]
                        const supervisorRejection = !opinion && /^V(\d+)$/.test(versionLabel)
                          ? (p.histories || []).find(history => {
                              const submissionNumber = Number((history.metadata as Record<string, unknown> | null)?.submission_number)
                              return history.action === 'supervisor_rejected'
                                && Number.isFinite(submissionNumber)
                                && `V${submissionNumber}` === versionLabel
                          })
                          : null
                        const rejectionActor = doc.rejected_by?.name
                          || (opinion?.decision === 'not_approved'
                          ? opinion.issued_by?.name ?? null
                          : supervisorRejection?.actor?.name ?? null)

                        return (
                          <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '10px 12px', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', fontWeight: 'var(--font-medium)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--outline)' }}>history</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <button type="button" onClick={() => downloadFile(doc.download_url, doc.file_name)} disabled={!doc.download_url} style={{ background: 'transparent', border: 'none', padding: 0, margin: 0, color: 'var(--primary)', textAlign: 'left', fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', cursor: doc.download_url ? 'pointer' : 'not-allowed', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '6px', maxWidth: '100%' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</span>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                              </button>
                              <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: 0 }}>Versão {versionLabel} • histórico</p>
                              {rejectionActor && (
                                <p style={{ fontSize: 'var(--label-sm)', color: 'var(--error)', margin: '4px 0 0 0' }}>
                                  Não Aprovado por {rejectionActor}
                                </p>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                              <button type="button" onClick={() => openFile(doc.download_url, doc.file_name)} disabled={!doc.download_url} className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px var(--space-2)', fontSize: 'var(--label-sm)', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', cursor: doc.download_url ? 'pointer' : 'not-allowed', fontWeight: 'var(--font-medium)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>Ver
                              </button>
                              {doc.download_url && (
                                <button type="button" onClick={() => downloadFile(doc.download_url, doc.file_name)} className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px var(--space-2)', fontSize: 'var(--label-sm)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'var(--font-medium)', border: '1px solid var(--outline-variant)' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>Baixar
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </details>
                )}

                {p.protocol_document_requirements && p.protocol_document_requirements.length > 0 && (() => {
                  const ccReqs = p.protocol_document_requirements.filter(req => req.required_for_organ === 'comite_cientifico' && !req.is_optional)
                  const cibsReqs = p.protocol_document_requirements.filter(req => req.required_for_organ === 'comite_bioetica' && !req.is_optional)
                  const otherReqs = p.protocol_document_requirements.filter(req => Boolean(req.is_optional))
                  const allReqs = p.protocol_document_requirements

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        <div>
                          <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Anexos do protocolo
                          </p>
                          <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
                            Acompanhe a validação documental feita pelas secretarias.
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>upload_file</span>
                            {allReqs.filter(req => req.enviado).length}/{allReqs.length} enviados
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                            {allReqs.filter(req => req.aprovado === true).length} aprovados
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: allReqs.some(req => req.aprovado === false) ? 'var(--error-container)' : 'var(--surface-container-low)', color: allReqs.some(req => req.aprovado === false) ? 'var(--on-error-container)' : 'var(--on-surface-variant)', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>cancel</span>
                            {allReqs.filter(req => req.aprovado === false).length} não aprovados
                          </span>
                        </div>
                      </div>

                      {ccReqs.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                          <SummaryGroupLabel>Obrigatórios — Comité Científico</SummaryGroupLabel>
                          <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface-container-lowest)' }}>
                            {ccReqs.map((req, index) => (
                              <RequirementValidationRow
                                key={req.id}
                                req={req}
                                isFirst={index === 0}
                                uploading={uploadingRequirementId === req.id}
                                onDownload={r => downloadFile(r.download_url, r.file_name || r.nome)}
                                onReupload={reuploadRequirement}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {cibsReqs.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                          <SummaryGroupLabel>Obrigatórios — Comité de Bioética (CIBS)</SummaryGroupLabel>
                          <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface-container-lowest)' }}>
                            {cibsReqs.map((req, index) => (
                              <RequirementValidationRow
                                key={req.id}
                                req={req}
                                isFirst={index === 0}
                                uploading={uploadingRequirementId === req.id}
                                onDownload={r => downloadFile(r.download_url, r.file_name || r.nome)}
                                onReupload={reuploadRequirement}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {otherReqs.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                          <SummaryGroupLabel>Outros documentos</SummaryGroupLabel>
                          <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface-container-lowest)' }}>
                            {otherReqs.map((req, index) => (
                              <RequirementValidationRow
                                key={req.id}
                                req={req}
                                isFirst={index === 0}
                                uploading={uploadingRequirementId === req.id}
                                onDownload={r => downloadFile(r.download_url, r.file_name || r.nome)}
                                onReupload={reuploadRequirement}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {opinions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Pareceres e fichas
                    </p>
                    {opinions.some(o => o.is_signed) && (
                      <div style={{ padding: '10px var(--space-3)', background: 'var(--primary-container)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--primary)', fontSize: 'var(--body-sm)', color: 'var(--on-primary-container)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-1)', marginBottom: 'var(--space-1)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0, marginTop: '2px' }}>verified</span>
                        <span>A secretaria assinou e enviou o parecer. A versão assinada está disponível abaixo.</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      {opinions.map(opinion => (
                        <div key={opinion.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', padding: '10px var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', flexWrap: 'wrap' }}>
                          <div>
                            <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              {opinion.organ} • {opinion.decision === 'approved' ? 'Aprovado' : 'Não Aprovado'}
                              {opinion.is_signed && (
                                <span style={{ fontSize: 'var(--label-sm)', fontWeight: 'var(--font-medium)', color: 'var(--primary)', background: 'var(--primary-container)', padding: '2px 10px', borderRadius: 'var(--radius-full)' }}>
                                  Assinado{opinion.signed_by?.name ? ` por ${opinion.signed_by.name}` : ''}
                                </span>
                              )}
                            </p>
                            <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>Versão {opinion.version}</p>
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                            {opinion.is_signed && opinion.signed_download_url && (
                              <button type="button" onClick={() => previewPdf(opinion.signed_download_url, `Parecer assinado ${p.code}`, `parecer-assinado-${p.code}.pdf`)} className="btn btn-small">
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>Ver Assinado
                              </button>
                            )}
                            {opinion.is_signed && opinion.signed_download_url && (
                              <button type="button" onClick={() => downloadFile(opinion.signed_download_url, `parecer-assinado-${p.code}.pdf`)} className="btn btn-small">
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>Baixar Assinado
                              </button>
                            )}
                            {opinion.evaluation_form_download_url && (
                              <button type="button" onClick={() => previewPdf(opinion.evaluation_form_download_url, `Ficha de Avaliação ${p.code}`, `ficha-${p.code}.pdf`)} className="btn btn-small">
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>Ver Ficha
                              </button>
                            )}
                            {opinion.evaluation_form_download_url && (
                              <button type="button" onClick={() => downloadFile(opinion.evaluation_form_download_url, `ficha-${p.code}.pdf`)} className="btn btn-small">
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>assignment</span>Baixar Ficha
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )
          })}
        </div>
      )}

      {/* Estado vazio */}
      {protocols.length === 0 && canSubmitNew && (
        <div style={{ textAlign: 'center', padding: 'var(--space-5) var(--space-3)', color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--outline-variant)', marginBottom: 'var(--space-4)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>description</span>
          <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>Nenhum protocolo submetido</p>
          <p style={{ fontSize: 'var(--body-md)', marginTop: 'var(--space-1)' }}>Selecione um tema aprovado abaixo para submeter o seu protocolo.</p>
        </div>
      )}

      {/* Formulário de submissão inicial */}
      {canSubmitNew && (
        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', marginBottom: 'var(--space-1)' }}>
            {selectedTopic?.can_resubmit_protocol ? 'Ressubmeter protocolo' : 'Submeter novo protocolo'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-2)' }}>
            {([
              { step: 1, label: 'Protocolo' },
              { step: 2, label: 'Anexos' },
              { step: 3, label: 'Confirmação' },
            ] as const).map(item => (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  if (item.step === 1 || (item.step === 2 && protocolStepComplete) || (item.step === 3 && protocolStepComplete && requiredDocumentsComplete && cibsDocumentsComplete)) {
                    setFormStep(item.step)
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px var(--space-2)',
                  borderRadius: 'var(--radius-full)',
                  border: formStep === item.step ? '1px solid var(--primary)' : '1px solid var(--outline-variant)',
                  background: formStep === item.step ? 'var(--primary-container)' : 'var(--surface-container-low)',
                  color: formStep === item.step ? 'var(--on-primary-container)' : 'var(--on-surface-variant)',
                  cursor: 'pointer',
                  fontSize: 'var(--label-md)',
                  fontWeight: 'var(--font-semibold)',
                }}
              >
                <span style={{ width: '24px', height: '24px', borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: formStep === item.step ? 'var(--primary)' : 'var(--surface-container)', color: formStep === item.step ? 'var(--on-primary)' : 'var(--on-surface-variant)' }}>
                  {item.step}
                </span>
                {item.label}
              </button>
            ))}
          </div>

          {formStep === 1 && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label htmlFor="topicId" style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>Tema aprovado</label>
                <select id="topicId" value={selectedTopicId} onChange={e => setSelectedTopicId(e.target.value)} required disabled={loadingTopics || approvedTopics.length === 0} style={{ width: '100%', padding: '12px var(--space-2)', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', cursor: approvedTopics.length === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', boxSizing: 'border-box', appearance: 'auto' }}>
                  <option value="">{loadingTopics ? 'A carregar temas...' : approvedTopics.length === 0 ? 'Nenhum tema aprovado disponível' : 'Selecione um tema'}</option>
                  {approvedTopics.map(topic => {
                    const hasActiveProtocol = Boolean(topic.has_protocol && !topic.can_resubmit_protocol)

                    return (
                      <option key={topic.id} value={topic.id} disabled={hasActiveProtocol}>
                        {topic.title}
                        {topic.can_resubmit_protocol ? ' (não aprovado, pode ressubmeter)' : hasActiveProtocol ? ' (já tem protocolo ativo)' : ''}
                      </option>
                    )
                  })}
                </select>
                {selectedTopic && <TopicJustificationToggle justification={selectedTopic.justification} showEmpty compact style={{ marginTop: 'var(--space-1)' }} />}
                {selectedTopic && topicHasActiveProtocol && (
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--error)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>warning</span>Este tema já possui um protocolo ativo.
                  </p>
                )}
                {selectedTopic?.can_resubmit_protocol && (
                  <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', background: 'var(--primary-container)', color: 'var(--on-primary-container)', border: '1px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-1)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>restart_alt</span>
                        <div>
                          <p style={{ fontWeight: 'var(--font-semibold)', marginBottom: '2px' }}>Ressubmissão detectada</p>
                          <p style={{ fontSize: 'var(--body-sm)' }}>
                            {selectedTopic.latest_protocol_status_label || 'Último protocolo não aprovado'}. Os anexos anteriores serão reutilizados se não forem trocados.
                          </p>
                        </div>
                      </div>
                      {selectedProtocol && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 10px', borderRadius: 'var(--radius-full)', background: 'var(--primary)', color: 'var(--on-primary)', fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)' }}>
                          Versão {selectedProtocol.version}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                      {CC_REQUIRED_DOCUMENTS.map(doc => {
                        const attachment = requiredDocuments[doc.key]
                        const previousRequirement = selectedProtocolRequirementsByKey[doc.key]
                        const reused = !attachment && Boolean(previousRequirement?.file_name)

                        return (
                          <span key={doc.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.35)', color: 'var(--on-primary-container)', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-medium)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{attachment ? 'check_circle' : reused ? 'history' : 'pending'}</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
                          </span>
                        )
                      })}
                    </div>
                    {reusedRequiredDocuments.length > 0 && (
                      <p style={{ fontSize: 'var(--label-sm)', margin: 0 }}>
                        {reusedRequiredDocuments.length} anexo{reusedRequiredDocuments.length !== 1 ? 's' : ''} do Comité Científico ser{reusedRequiredDocuments.length !== 1 ? 'ão' : 'á'} reutilizado{reusedRequiredDocuments.length !== 1 ? 's' : ''} automaticamente se não forem substituídos.
                      </p>
                    )}
                    {CIBS_REQUIRED_DOCUMENTS.map(doc => {
                      const attachment = cibsDocuments[doc.key]
                      const previousRequirement = selectedProtocolRequirementsByKey[doc.key]
                      const reused = !attachment && Boolean(previousRequirement?.file_name)

                      return (
                        <span key={doc.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.35)', color: 'var(--on-primary-container)', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-medium)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{attachment ? 'check_circle' : reused ? 'history' : 'pending'}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
                        </span>
                      )
                    })}
                    {reusedCIBSDocuments.length > 0 && (
                      <p style={{ fontSize: 'var(--label-sm)', margin: 0 }}>
                        {reusedCIBSDocuments.length} anexo{reusedCIBSDocuments.length !== 1 ? 's' : ''} do Comité de Bioética ser{reusedCIBSDocuments.length !== 1 ? 'ão' : 'á'} reutilizado{reusedCIBSDocuments.length !== 1 ? 's' : ''} automaticamente se não forem substituídos.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label htmlFor="protocolType" style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>Tipo</label>
                  <select id="protocolType" value={protocolType} onChange={e => setProtocolType(e.target.value)} style={{ width: '100%', padding: '12px var(--space-2)', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', cursor: 'pointer', transition: 'all 0.2s ease', boxSizing: 'border-box', appearance: 'auto' }}>
                    <option value="protocol">Protocolo</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label htmlFor="file" style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>Documento principal (.docx)</label>
                  <div style={{ position: 'relative' }}>
                    <input id="file" type="file" accept=".docx" onChange={e => setFile(e.target.files?.[0] ?? null)} required style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '12px var(--space-2)', background: 'var(--surface-container-lowest)', border: '1px dashed var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', color: file ? 'var(--on-surface)' : 'var(--on-surface-variant)', transition: 'all 0.2s ease', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(0,105,51,0.02)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--outline-variant)'; e.currentTarget.style.background = 'var(--surface-container-lowest)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>{file ? 'check_circle' : 'upload'}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file ? `${file.name} (${formatFileSize(file.size)})` : 'Selecionar ficheiro .docx...'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-primary" disabled={!protocolStepComplete} onClick={() => setFormStep(2)} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', padding: '12px var(--space-3)', borderRadius: 'var(--radius-lg)', opacity: !protocolStepComplete ? 0.6 : 1, cursor: !protocolStepComplete ? 'not-allowed' : 'pointer' }}>
                  Seguinte
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                </button>
              </div>
            </>
          )}

          {formStep === 2 && (
            <>
              <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', marginBottom: '4px' }}>Anexos do protocolo</p>
                    <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)' }}>
                      Aceita apenas ficheiros em formato PDF, até 10 MB cada. Na ressubmissão, os anexos existentes serão reutilizados se não forem substituídos.
                    </p>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--radius-full)', background: requiredDocumentsComplete && cibsDocumentsComplete ? 'var(--primary-container)' : 'var(--surface-container-lowest)', color: requiredDocumentsComplete && cibsDocumentsComplete ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', border: '1px solid var(--outline-variant)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{requiredDocumentsComplete && cibsDocumentsComplete ? 'check_circle' : 'pending_actions'}</span>
                    {readyRequiredDocumentsCount + readyCIBSDocumentsCount}/{CC_REQUIRED_DOCUMENTS.length + CIBS_REQUIRED_DOCUMENTS.length} obrigatórios prontos
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add_circle</span>
                    {selectedRequiredDocumentsCount + cibsDocumentUploadRows.filter(row => Boolean(row.attachment)).length} novo{selectedRequiredDocumentsCount + cibsDocumentUploadRows.filter(row => Boolean(row.attachment)).length !== 1 ? 's' : ''}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>history</span>
                    {reusedRequiredDocuments.length + reusedCIBSDocuments.length} reutilizado{reusedRequiredDocuments.length + reusedCIBSDocuments.length !== 1 ? 's' : ''}
                  </span>
                  {rejectedPreviousDocumentsCount > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--error-container)', color: 'var(--on-error-container)', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>cancel</span>
                      {rejectedPreviousDocumentsCount} não aprovado{rejectedPreviousDocumentsCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {selectedProtocol && selectedTopic?.can_resubmit_protocol && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>restart_alt</span>
                      Versão anterior {selectedProtocol.version}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 'var(--space-1)' }}>
                  Obrigatórios — Comité Científico
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface-container-lowest)' }}>
                  {requiredDocumentUploadRows.map(({ doc, attachment, previousRequirement }, index) => (
                    <DocumentUploadRow
                      key={doc.key}
                      doc={doc}
                      attachment={attachment}
                      previousRequirement={previousRequirement}
                      onAttach={file => setRequiredDocument(doc.key, file)}
                      first={index === 0}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 'var(--space-1)' }}>
                    Obrigatórios — Comité de Bioética (CIBS)
                  </p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: cibsDocumentsComplete ? 'var(--primary-container)' : 'var(--surface-container-lowest)', color: cibsDocumentsComplete ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{cibsDocumentsComplete ? 'check_circle' : 'pending_actions'}</span>
                    {readyCIBSDocumentsCount}/{CIBS_REQUIRED_DOCUMENTS.length} prontos
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface-container-lowest)' }}>
                  {cibsDocumentUploadRows.map(({ doc, attachment, previousRequirement }, index) => (
                    <DocumentUploadRow
                      key={doc.key}
                      doc={doc}
                      attachment={attachment}
                      previousRequirement={previousRequirement}
                      onAttach={file => setCIBSDocument(doc.key, file)}
                      first={index === 0}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 'var(--space-1)' }}>
                    Outros documentos (opcionais)
                  </p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>attach_file</span>
                    {readyOtherDocumentsCount} anexado{readyOtherDocumentsCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface-container-lowest)' }}>
                  {otherDocuments.length === 0 && (
                    <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', padding: 'var(--space-3)' }}>
                      Nenhum documento opcional adicionado. Adicione abaixo se necessário.
                    </p>
                  )}
                  {otherDocumentRows.map((other, index) => {
                    const hasFile = Boolean(other.file)

                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', padding: '14px var(--space-3)', borderTop: index === 0 ? 'none' : '1px dashed var(--outline-variant)', borderLeft: '4px solid var(--outline-variant)', background: 'var(--surface-container-lowest)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: '1 1 360px', minWidth: 0 }}>
                          <span className="material-symbols-outlined" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-lg)', background: hasFile ? 'rgba(255,255,255,0.55)' : 'var(--surface-container-low)', color: hasFile ? 'var(--primary)' : 'var(--outline)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                            {hasFile ? 'check_circle' : 'attach_file'}
                          </span>
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                            <input
                              type="text"
                              value={other.name}
                              onChange={e => setOtherDocument(index, { name: e.target.value })}
                              placeholder="Nome do documento"
                              style={{ width: '100%', padding: '8px var(--space-2)', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-md)', fontSize: 'var(--body-sm)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', boxSizing: 'border-box' }}
                            />
                            <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {other.file ? `${other.file.name} (${formatFileSize(other.file.size)})` : 'Nenhum ficheiro carregado'}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <label className="btn btn-small" style={{ cursor: 'pointer' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{hasFile ? 'sync' : 'attach_file'}</span>
                            {hasFile ? 'Trocar' : 'Anexar'}
                            <input type="file" accept=".pdf,application/pdf" onChange={e => setOtherDocument(index, { file: e.target.files?.[0] ?? null })} style={{ display: 'none' }} />
                          </label>
                          <button type="button" className="btn btn-small" onClick={() => setOtherDocuments(prev => prev.filter((_, i) => i !== index))}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                            Remover
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-small" onClick={() => setOtherDocuments(prev => [...prev, { name: '', file: null }])}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                    Adicionar outro documento
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <button type="button" className="btn" onClick={() => setFormStep(1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', padding: '12px var(--space-3)', borderRadius: 'var(--radius-lg)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                  Voltar
                </button>
                <button type="button" className="btn btn-primary" disabled={!requiredDocumentsComplete || !cibsDocumentsComplete} onClick={() => setFormStep(3)} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', padding: '12px var(--space-3)', borderRadius: 'var(--radius-lg)', opacity: !requiredDocumentsComplete || !cibsDocumentsComplete ? 0.6 : 1, cursor: !requiredDocumentsComplete || !cibsDocumentsComplete ? 'not-allowed' : 'pointer' }}>
                  Seguinte
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                </button>
              </div>
            </>
          )}

          {formStep === 3 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-3)' }}>
                <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
                  <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Protocolo</p>
                  <p style={{ marginTop: 'var(--space-1)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)' }}>{selectedTopic?.title || 'Tema não selecionado'}</p>
                  <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)' }}>{file ? `${file.name} (${formatFileSize(file.size)})` : 'Documento principal em falta'}</p>
                </div>
                <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', border: '1px solid var(--outline-variant)' }}>
                  <p style={{ fontWeight: 'var(--font-semibold)', marginBottom: '4px' }}>Fluxo após submissão</p>
                  <p style={{ fontSize: 'var(--body-sm)' }}>1. Supervisor autoriza o protocolo. 2. Secretaria do CC valida os anexos. 3. Comité Científico avalia. 4. Secretaria do CIBS valida os anexos do Comité de Bioética. 5. Comité de Bioética avalia e decide.</p>
                  {isResubmission && (reusedRequiredDocuments.length > 0 || reusedCIBSDocuments.length > 0) && (
                    <p style={{ fontSize: 'var(--label-sm)', marginTop: 'var(--space-1)' }}>
                      {reusedRequiredDocuments.length + reusedCIBSDocuments.length} anexo{reusedRequiredDocuments.length + reusedCIBSDocuments.length !== 1 ? 's' : ''} ser{reusedRequiredDocuments.length + reusedCIBSDocuments.length !== 1 ? 'ão' : 'á'} reutilizado{reusedRequiredDocuments.length + reusedCIBSDocuments.length !== 1 ? 's' : ''} se não forem trocados.
                    </p>
                  )}
                </div>
              </div>

              <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}>
                <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>Anexos selecionados</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <SummaryGroupLabel>Obrigatórios — Comité Científico</SummaryGroupLabel>
                  {requiredDocumentUploadRows.map(({ doc, attachment, previousRequirement, state }) => {
                    const hasFile = Boolean(attachment || previousRequirement?.file_name)
                    const fileLabel = attachment
                      ? `${attachment.name} (${formatFileSize(attachment.size)})`
                      : previousRequirement?.file_name || 'Ficheiro em falta'

                    return (
                      <SummaryRow key={doc.key} name={doc.name} fileLabel={fileLabel} hasFile={hasFile} icon={state.icon} color={state.color} label={state.label} />
                    )
                  })}
                  <SummaryGroupLabel>Obrigatórios — Comité de Bioética (CIBS)</SummaryGroupLabel>
                  {cibsDocumentUploadRows.map(({ doc, attachment, previousRequirement, state }) => {
                    const hasFile = Boolean(attachment || previousRequirement?.file_name)
                    const fileLabel = attachment
                      ? `${attachment.name} (${formatFileSize(attachment.size)})`
                      : previousRequirement?.file_name || 'Ficheiro em falta'

                    return (
                      <SummaryRow key={doc.key} name={doc.name} fileLabel={fileLabel} hasFile={hasFile} icon={state.icon} color={state.color} label={state.label} />
                    )
                  })}
                  <SummaryGroupLabel>Outros documentos (opcionais)</SummaryGroupLabel>
                  {otherDocumentRows.length === 0 && (
                    <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', padding: '4px 2px' }}>
                      Nenhum documento opcional adicionado.
                    </p>
                  )}
                  {otherDocumentRows.map((other, index) => {
                    const hasFile = Boolean(other.file)

                    return (
                      <SummaryRow
                        key={index}
                        name={other.name || 'Outro documento'}
                        fileLabel={hasFile ? `${other.file!.name} (${formatFileSize(other.file!.size)})` : 'Não anexado'}
                        hasFile={hasFile}
                        tone="neutral"
                        icon={hasFile ? 'check_circle' : 'pending_actions'}
                        color={hasFile ? 'var(--primary)' : 'var(--outline)'}
                        label={hasFile ? 'Anexado' : 'Opcional'}
                      />
                    )
                  })}
                </div>
              </div>

              {rejectedPreviousDocumentsCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', background: 'var(--error-container)', color: 'var(--on-error-container)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-sm)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>info</span>
                  <p>
                    Existem anexos não aprovados anteriormente que serão reutilizados se não forem substituídos nesta ressubmissão.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <button type="button" className="btn" onClick={() => setFormStep(2)} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', padding: '12px var(--space-3)', borderRadius: 'var(--radius-lg)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                  Voltar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !protocolStepComplete || !requiredDocumentsComplete || !cibsDocumentsComplete} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)', padding: '14px var(--space-3)', fontSize: 'var(--body-lg)', fontWeight: 'var(--font-semibold)', borderRadius: 'var(--radius-lg)', border: 'none', cursor: submitting || !protocolStepComplete || !requiredDocumentsComplete || !cibsDocumentsComplete ? 'not-allowed' : 'pointer', opacity: submitting || !protocolStepComplete || !requiredDocumentsComplete || !cibsDocumentsComplete ? 0.7 : 1, transition: 'all 0.2s ease', boxShadow: 'var(--elevation-1)' }}>
                  {submitting ? (
                    <><span style={{ width: '18px', height: '18px', border: '2px solid var(--on-primary)', borderTopColor: 'transparent', borderRadius: 'var(--radius-full)', animation: 'spin 0.8s linear infinite' }} />A enviar...</>
                  ) : (
                    <><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>Submeter protocolo</>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {/* Mensagem de bloqueio */}
      {!canSubmitNew && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--tertiary)', flexShrink: 0 }}>info</span>
          <p>O teu protocolo está em curso ({current?.status_label}). Não podes submeter uma nova versão agora.</p>
        </div>
      )}

      {pdfPreview && (
        <PdfPreviewModal url={pdfPreview.url} title={pdfPreview.title} filename={pdfPreview.filename} onClose={() => setPdfPreview(null)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
