const BASE = import.meta.env.VITE_API_URL ?? ''

function token() {
  return localStorage.getItem('sgpmc_token')
}

export interface OnlyOfficeConfigResponse {
  config: Config
  token: string
}

async function fetchConfig(url: string): Promise<OnlyOfficeConfigResponse> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const authToken = token()
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  const res = await fetch(url, { method: 'GET', headers })
  const data: unknown = await res.json()

  if (!res.ok) {
    const message = typeof data === 'object' && data !== null && 'message' in data
      ? String(data.message)
      : typeof data === 'object' && data !== null && 'error' in data
        ? String(data.error)
        : 'Erro ao carregar configuração do ONLYOFFICE'
    throw new Error(message)
  }

  return data as OnlyOfficeConfigResponse
}

export const onlyOfficeService = {
  // rota real, protegida, resolve mode (edit/review/comment/view) conforme o utilizador
  getConfigForProtocol: (protocolId: number) =>
    fetchConfig(`${BASE}/api/onlyoffice/config/${protocolId}`),

  getConfigForTopic: (topicId: number) =>
    fetchConfig(`${BASE}/api/onlyoffice/topic/${topicId}`),
}
import type { Config } from '@onlyoffice/doceditor-types'
