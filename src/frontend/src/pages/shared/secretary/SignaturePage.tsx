import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth, type SecretaryProfile } from '../../../context/AuthContext'
import { protocolService, type Protocol } from '../../../services/protocolService'
import './secretaryWorkspace.css'

type PendingSignature = {
  protocol: Protocol
  opinion: NonNullable<NonNullable<Protocol['organ_tracking']>['latest_opinion']>
}

const signatureStatusByOrgan = {
  scientific_committee: 'protocol_parecer_pending_cc_signature',
  bioethics_committee: 'protocol_parecer_pending_cibs_signature',
} as const

function formatDate(value?: string | null) {
  if (!value) return 'Data não disponível'

  return new Intl.DateTimeFormat('pt-MZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Maputo',
  }).format(new Date(value))
}

export default function SignaturePage() {
  const { activeProfile } = useAuth()
  const secretary = activeProfile as SecretaryProfile | null
  const organType = secretary?.organ?.type
  const isCommittee = organType === 'scientific_committee' || organType === 'bioethics_committee'
  const organName = organType === 'scientific_committee' ? 'Comité Científico' : 'Comité de Bioética'
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [files, setFiles] = useState<Record<number, File | undefined>>({})
  const [loading, setLoading] = useState(true)
  const [signingOpinionId, setSigningOpinionId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isCommittee) {
      setLoading(false)
      setProtocols([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = organType === 'scientific_committee'
        ? await protocolService.listForSecretaryCC()
        : await protocolService.listForSecretaryBioetica()
      setProtocols(response.protocols)
    } catch (requestError) {
      setProtocols([])
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar os pareceres.')
    } finally {
      setLoading(false)
    }
  }, [isCommittee, organType])

  useEffect(() => {
    const requestId = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(requestId)
  }, [load])

  const pendingSignatures = useMemo<PendingSignature[]>(() => {
    if (!isCommittee) return []

    const pendingStatus = signatureStatusByOrgan[organType]
    return protocols.flatMap(protocol => {
      const opinion = protocol.organ_tracking?.latest_opinion
      return protocol.status === pendingStatus && opinion && !opinion.is_signed
        ? [{ protocol, opinion }]
        : []
    })
  }, [isCommittee, organType, protocols])

  async function downloadOpinion(item: PendingSignature) {
    setError(null)
    try {
      await protocolService.downloadFile(item.opinion.download_url || '', `parecer-${item.protocol.code}.pdf`)
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Não foi possível descarregar o parecer.')
    }
  }

  async function submitSignedOpinion(item: PendingSignature) {
    const file = files[item.opinion.id]
    if (!file) {
      setError('Seleciona o parecer assinado em PDF antes de enviar.')
      return
    }

    setSigningOpinionId(item.opinion.id)
    setError(null)
    setMessage(null)
    try {
      const response = await protocolService.submitSignedParecer(item.protocol.id, item.opinion.id, file)
      setFiles(current => {
        const next = { ...current }
        delete next[item.opinion.id]
        return next
      })
      setMessage(response.message)
      await load()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível enviar o parecer assinado.')
    } finally {
      setSigningOpinionId(null)
    }
  }

  if (!isCommittee) {
    return (
      <main className="secretary-workspace" aria-labelledby="signature-title">
        <header className="secretary-page-header"><div><h1 id="signature-title" className="secretary-page-header__title">Assinar pareceres</h1></div></header>
        <div className="secretary-empty-state"><span className="material-symbols-outlined" aria-hidden="true">block</span><strong>Assinatura indisponível neste órgão</strong><span>A assinatura de pareceres é feita apenas pelas secretarias dos comités.</span></div>
      </main>
    )
  }

  return (
    <main className="secretary-workspace" aria-labelledby="signature-title">
      <header className="secretary-page-header">
        <div>
          <p className="secretary-page-header__eyebrow">{organName}</p>
          <h1 id="signature-title" className="secretary-page-header__title">Assinar pareceres</h1>
          <p className="secretary-page-header__description">Descarrega o parecer aprovado, assina-o e envia a versão final em PDF.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => void load()} disabled={loading}>
          <span className="material-symbols-outlined" aria-hidden="true">refresh</span>Atualizar
        </button>
      </header>

      {error && <div className="secretary-alert secretary-alert--error" role="alert" aria-live="assertive"><span className="material-symbols-outlined" aria-hidden="true">error</span><span>{error}</span></div>}
      {message && <div className="secretary-alert secretary-alert--success" role="status" aria-live="polite"><span className="material-symbols-outlined" aria-hidden="true">check_circle</span><span>{message}</span></div>}

      <section className="secretary-summary-grid" aria-label="Resumo de pareceres">
        <div className="secretary-stat"><span className="secretary-stat__label">A aguardar assinatura</span><strong className="secretary-stat__value">{pendingSignatures.length}</strong></div>
        <div className="secretary-stat"><span className="secretary-stat__label">Órgão</span><strong className="secretary-stat__text">{organName}</strong></div>
      </section>

      {loading ? (
        <div className="secretary-loading"><span className="secretary-spinner" aria-hidden="true" />A carregar pareceres…</div>
      ) : pendingSignatures.length === 0 ? (
        <div className="secretary-empty-state"><span className="material-symbols-outlined" aria-hidden="true">draw</span><strong>Não há pareceres a assinar</strong><span>Os pareceres aprovados aparecerão aqui quando aguardarem a assinatura da secretaria.</span></div>
      ) : (
        <section className="secretary-signature-list" aria-label="Pareceres a assinar">
          {pendingSignatures.map(item => {
            const inputId = `signed-opinion-${item.opinion.id}`
            const isSigning = signingOpinionId === item.opinion.id
            return <article key={item.opinion.id} className="secretary-signature-card">
              <div className="secretary-signature-card__header">
                <div>
                  <p className="secretary-row__eyebrow">{item.protocol.code}</p>
                  <h2 className="secretary-signature-card__title">{item.protocol.topic?.title || 'Protocolo sem tema associado'}</h2>
                  <p className="secretary-helper-text">Parecer emitido em {formatDate(item.opinion.issued_at)} · Versão {item.opinion.version}</p>
                </div>
                <span className="secretary-status-badge secretary-status-badge--pending">A aguardar assinatura</span>
              </div>

              <div className="secretary-signature-card__actions">
                <button type="button" className="btn btn-outline" onClick={() => void downloadOpinion(item)} disabled={!item.opinion.download_url || isSigning}>
                  <span className="material-symbols-outlined" aria-hidden="true">download</span>Baixar parecer
                </button>
                <div className="secretary-control-group secretary-signature-card__file">
                  <label className="secretary-field-label" htmlFor={inputId}>Parecer assinado</label>
                  <input id={inputId} className="secretary-control" type="file" accept="application/pdf" onChange={event => setFiles(current => ({ ...current, [item.opinion.id]: event.target.files?.[0] }))} disabled={isSigning} />
                </div>
                <button type="button" className="btn btn-primary" onClick={() => void submitSignedOpinion(item)} disabled={isSigning || !files[item.opinion.id]}>
                  <span className="material-symbols-outlined" aria-hidden="true">upload</span>{isSigning ? 'A enviar…' : 'Enviar assinado'}
                </button>
              </div>
            </article>
          })}
        </section>
      )}
    </main>
  )
}
