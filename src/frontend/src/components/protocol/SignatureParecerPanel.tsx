// src/components/protocol/SignatureParecerPanel.tsx
import { useRef, useState } from 'react'
import { protocolService, type Protocol } from '../../services/protocolService'

interface Props {
  protocol: Protocol
  orgName: 'Comité Científico' | 'Comité de Bioética'
  onDownloadParecer: (url: string | null | undefined, filename?: string | null) => void
  onDone: () => void
}

export function SignatureParecerPanel({ protocol, orgName, onDownloadParecer, onDone }: Props) {
  const opinion = protocol.organ_tracking?.latest_opinion
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit() {
    if (!file) {
      setError('Seleciona o ficheiro assinado em PDF para enviar.')
      return
    }
    if (!opinion) {
      setError('Não foi encontrado o parecer a assinar para este protocolo.')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      await protocolService.submitSignedParecer(protocol.id, opinion.id, file)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      onDone()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
      <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--tertiary)' }}>draw</span>
        Parecer do {orgName} a aguardar assinatura
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {opinion?.download_url ? (
          <button
            type="button"
            className="btn btn-small"
            onClick={() => onDownloadParecer(opinion.download_url, `parecer-${protocol.code}.pdf`)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
            Baixar parecer para assinar
          </button>
        ) : (
          <span style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)' }}>Parecer não disponível.</span>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', maxWidth: '100%', flex: '1 1 260px' }}
        />

        <button
          type="button"
          className="btn btn-primary"
          disabled={submitting || !file}
          onClick={handleSubmit}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: submitting || !file ? 0.6 : 1, cursor: submitting || !file ? 'not-allowed' : 'pointer' }}
        >
          {submitting ? 'A enviar...' : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
              Enviar ao estudante
            </>
          )}
        </button>
      </div>

      <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', margin: '10px 0 0' }}>
        Baixa o parecer gerado, assina-o (digitalmente ou com carimbo) e envia a versão assinada em PDF. O protocolo avança automaticamente e o estudante recebe o parecer assinado.
      </p>

      {error && (
        <div role="alert" style={{ marginTop: 'var(--space-2)', padding: '10px var(--space-3)', background: 'var(--error-container)', color: 'var(--on-error-container)', borderRadius: 'var(--radius-md)', fontSize: 'var(--body-sm)', fontWeight: 'var(--font-medium)' }}>
          {error}
        </div>
      )}
    </div>
  )
}