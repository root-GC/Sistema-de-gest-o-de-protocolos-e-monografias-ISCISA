const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function token() {
  return localStorage.getItem('sgpmc_token')
}

export interface OnlyOfficeConfigResponse {
  config: any
  token: string
}

export const onlyOfficeService = {
  async getConfig(): Promise<OnlyOfficeConfigResponse> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    }

    const authToken = token()

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`
    }

    const res = await fetch(`${BASE}/api/onlyoffice/config`, {
      method: 'GET',
      headers,
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message ?? 'Erro ao carregar configuração do ONLYOFFICE')
    }

    return data
  },
}