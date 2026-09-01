//src/components/OnlyOfficeEditor/OnlyOfficeEditor.tsx
import { useEffect, useState } from 'react'
import { DocumentEditor } from '@onlyoffice/document-editor-react'
import type { Config } from '@onlyoffice/doceditor-types'
import { onlyOfficeService } from '../../services/onlyOfficeService'

const configuredDocumentServerUrl = import.meta.env.VITE_ONLYOFFICE_URL?.trim()
const DOCUMENT_SERVER_URL = configuredDocumentServerUrl
  || `${window.location.protocol}//${window.location.hostname}:8088`

interface OnlyOfficeEditorProps {
  protocolId?: number
  topicId?: number
  height?: string
  onDocumentReady?: () => void
}

export default function OnlyOfficeEditor({ protocolId, topicId, height = '100%', onDocumentReady }: OnlyOfficeEditorProps) {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (!topicId && !protocolId) {
          throw new Error('Selecione uma submissão para abrir o documento.')
        }

        const response = topicId
          ? await onlyOfficeService.getConfigForTopic(topicId)
          : await onlyOfficeService.getConfigForProtocol(protocolId!)

        if (!cancelled) {
          setConfig({ ...response.config, token: response.token })
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar o editor.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [protocolId, topicId])

  if (loading) return <h2>A carregar editor...</h2>
  if (error) return <h2>{error}</h2>
  if (!config) return <h2>Não foi possível carregar a configuração.</h2>

  return (
    <DocumentEditor
      // a key precisa mudar quando o documento (versão) muda, senão o
      // editor React não remonta e continua a mostrar o doc anterior
      id={`onlyoffice-editor-${config.document?.key ?? 'documento'}`}
      key={config.document?.key ?? 'documento'}
      documentServerUrl={DOCUMENT_SERVER_URL}
      config={config}
      height={height}
      events_onDocumentReady={onDocumentReady}
    />
  )
}
