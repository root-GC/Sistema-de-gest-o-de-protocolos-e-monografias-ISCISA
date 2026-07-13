import { useEffect, useState } from 'react'
import { DocumentEditor } from '@onlyoffice/document-editor-react'
import { onlyOfficeService } from '../../services/onlyOfficeService'

export default function OnlyOfficeEditor() {
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const response = await onlyOfficeService.getConfig()

        setConfig({
          ...response.config,
          token: response.token,
        })
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return <h2>A carregar editor...</h2>
  }

  if (!config) {
    return <h2>Não foi possível carregar a configuração.</h2>
  }

  return (
    <DocumentEditor
      id="onlyoffice-editor"
      documentServerUrl="http://localhost"
      config={config}
      height="900px"
    />
  )
}