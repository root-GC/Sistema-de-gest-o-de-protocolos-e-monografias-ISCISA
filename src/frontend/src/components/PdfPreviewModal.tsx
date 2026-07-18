import { useEffect, useState } from 'react'
import { createApiFileObjectUrl, downloadApiFile } from '../services/apiClient'

interface PdfPreviewModalProps {
  url: string
  title: string
  filename?: string
  onClose: () => void
}

export default function PdfPreviewModal({ url, title, filename, onClose }: PdfPreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [resolvedFilename, setResolvedFilename] = useState(filename || 'documento.pdf')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let revokeObjectUrl: (() => void) | null = null

    setLoading(true)
    setError(null)
    setObjectUrl(null)

    createApiFileObjectUrl(url, filename, true)
      .then(file => {
        if (cancelled) {
          file.revoke()
          return
        }

        revokeObjectUrl = file.revoke
        setObjectUrl(file.objectUrl)
        setResolvedFilename(file.filename)
      })
      .catch(e => {
        if (!cancelled) setError((e as Error).message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      revokeObjectUrl?.()
    }
  }, [url, filename])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleDownload() {
    try {
      await downloadApiFile(url, resolvedFilename)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(12, 18, 14, 0.55)'
      }}
    >
      <div
        style={{
          width: 'min(1100px, 100%)',
          height: 'min(860px, 92vh)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--surface-container-lowest)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--elevation-3)',
          border: '1px solid var(--outline-variant)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-2)',
            padding: '12px 16px',
            borderBottom: '1px solid var(--outline-variant)'
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 'var(--title-md)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--on-surface)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {title}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>
              {resolvedFilename}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <button type="button" onClick={handleDownload} className="btn btn-small">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
              Baixar
            </button>
            <button type="button" onClick={onClose} className="btn btn-small">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              Fechar
            </button>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, background: 'var(--surface-container-low)' }}>
          {loading && (
            <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--on-surface-variant)' }}>
              A carregar pré-visualização...
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: 'var(--space-4)', color: 'var(--on-error-container)' }}>
              {error}
            </div>
          )}

          {!loading && objectUrl && !error && (
            <iframe
              title={title}
              src={objectUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 0,
                background: 'white'
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
