const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function token() {
  return localStorage.getItem('sgpmc_token')
}

export interface OnlyOfficeConfigResponse {
  config: any
  token: string
}

async function fetchConfig(url: string): Promise<OnlyOfficeConfigResponse> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const authToken = token()
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  const res = await fetch(url, { method: 'GET', headers })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error ?? data.message ?? 'Erro ao carregar configuração do ONLYOFFICE')
  }

  return data
}

export const onlyOfficeService = {
  // rota de teste, sem protocolo
  getConfig: () => fetchConfig(`${BASE}/api/onlyoffice/config`),

  // rota real, protegida, resolve mode (edit/review/comment/view) conforme o utilizador
  getConfigForProtocol: (protocolId: number) =>
    fetchConfig(`${BASE}/api/onlyoffice/config/${protocolId}`),
}