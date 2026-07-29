//src/components/OnlyOfficeEditor/OnlyOfficeEditor.tsx
import { useEffect, useState } from 'react'
import { DocumentEditor } from '@onlyoffice/document-editor-react'
import { onlyOfficeService } from '../../services/onlyOfficeService'

const DOCUMENT_SERVER_URL = import.meta.env.VITE_ONLYOFFICE_URL ?? 'http://localhost'

interface OnlyOfficeEditorProps {
  protocolId?: number
  height?: string
  onDocumentReady?: () => void
}

export default function OnlyOfficeEditor({ protocolId, height = '100%', onDocumentReady }: OnlyOfficeEditorProps) {
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = protocolId
          ? await onlyOfficeService.getConfigForProtocol(protocolId)
          : await onlyOfficeService.getConfig()

        if (!cancelled) {
          setConfig({ ...response.config, token: response.token })
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? 'Erro ao carregar o editor.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [protocolId])

  if (loading) return <h2>A carregar editor...</h2>
  if (error) return <h2>{error}</h2>
  if (!config) return <h2>Não foi possível carregar a configuração.</h2>

  return (
    <DocumentEditor
      // a key precisa mudar quando o documento (versão) muda, senão o
      // editor React não remonta e continua a mostrar o doc anterior
      id={`onlyoffice-editor-${config.document.key}`}
      key={config.document.key}
      documentServerUrl={DOCUMENT_SERVER_URL}
      config={config}
      height={height}
      events_onDocumentReady={onDocumentReady}
    />
  )
}