// src/services/monographService.ts

const BASE = import.meta.env.VITE_API_URL ?? ''

function token(): string | null {
  return localStorage.getItem('sgpmc_token')
}

// ============================================================
// TIPOS
// ============================================================

export interface MonographDocument {
  id: number
  file_name: string
  version: number
  status: 'active' | 'inactive'
  download_url: string | null
  created_at: string
}

export interface MonographOpinion {
  id: number
  organ: string
  decision: 'approved' | 'rejected'
  version: number
  download_url: string | null
  evaluation_form_download_url: string | null
  created_at: string
}

export interface Monograph {
  id: number
  code: string
  title: string | null
  status: string
  status_label: string
  submission_number: number
  version: number
  student?: {
    id: number
    name: string
    email: string
    student_number?: string
  }
  topic?: {
    id: number
    title: string
  }
  documents: MonographDocument[]
  created_at: string
  updated_at: string
}

export interface MonographListResponse {
  monographs: Monograph[]
}

export interface MonographSubmitResponse {
  message: string
  monograph: Monograph
}

export interface MonographOpinionsResponse {
  opinions: MonographOpinion[]
}

export interface EligibleReviewersResponse {
  reviewers: { id: number; name: string; email?: string }[]
}

export interface AssignedReviewer {
  id: number
  assignment_id: number
  name: string
  email?: string
  slot: 'reviewer_one' | 'reviewer_two'
}

export interface AssignedReviewersResponse {
  reviewers: AssignedReviewer[]
}

export interface AssignReviewersResponse {
  message: string
}

// ============================================================
// HELPERS
// ============================================================

async function req<T>(method: string, path: string, body: unknown = null, isFormData = false): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  
  const t = token()
  if (t) headers['Authorization'] = `Bearer ${t}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : (body ? JSON.stringify(body) : null),
  })

  const data = await res.json()

  if (!res.ok) {
    const msg =
      data?.message ??
      (Object.values(data?.errors ?? {})[0] as string[] | undefined)?.[0] ??
      'Erro desconhecido'
    const error = new Error(msg) as Error & { status?: number }
    error.status = res.status
    throw error
  }

  return data as T
}

// ============================================================
// SERVIÇO
// ============================================================

export const monographService = {
  // ==================== ESTUDANTE ====================

  /**
   * Listar monografias do estudante logado
   */
  list: () =>
    req<MonographListResponse>('GET', '/api/monographs'),

  /**
   * Submeter nova monografia
   */
  submit: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return req<MonographSubmitResponse>('POST', '/api/monographs', formData, true)
  },

  /**
   * Listar pareceres de uma monografia
   */
  listOpinions: (monographId: number) =>
    req<MonographOpinionsResponse>('GET', `/api/monographs/${monographId}/opinions`),

  // ==================== SECRETÁRIO / NÚCLEO ====================

  /**
   * Listar todas as monografias (para secretário/núcleo)
   */
  listForSecretary: () =>
    req<MonographListResponse>('GET', '/api/v1/secretary/monographs'),

  /**
   * Listar revisores elegíveis para uma monografia
   */
  getEligibleReviewers: (monographId: number) =>
    req<EligibleReviewersResponse>('GET', `/api/v1/monographs/${monographId}/eligible-reviewers`),

  /**
   * Listar revisores atribuídos a uma monografia
   */
  getAssignedReviewers: (monographId: number) =>
    req<AssignedReviewersResponse>('GET', `/api/v1/monographs/${monographId}/reviewers`),

  /**
   * Atribuir revisores a uma monografia
   */
  assignReviewers: (monographId: number, reviewerOneId: number, reviewerTwoId: number) =>
    req<AssignReviewersResponse>('POST', `/api/v1/monographs/${monographId}/assign-reviewers`, {
      reviewer_one_id: reviewerOneId,
      reviewer_two_id: reviewerTwoId,
    }),

  // ==================== ARQUIVOS ====================

  /**
   * Abrir arquivo no navegador
   */
  openFile: async (url: string, _fallbackFilename?: string) => {
    const t = token()
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${t}`,
        Accept: 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,*/*',
      },
    })

    if (!res.ok) {
      throw new Error('Erro ao abrir o arquivo.')
    }

    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    window.open(blobUrl, '_blank')
  },

  /**
   * Fazer download do arquivo
   */
  downloadFile: async (url: string, fallbackFilename?: string) => {
    const t = token()
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${t}`,
        Accept: 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,*/*',
      },
    })

    if (!res.ok) {
      throw new Error('Erro ao baixar o arquivo.')
    }

    const blob = await res.blob()
    const contentDisposition = res.headers.get('content-disposition')
    let filename = fallbackFilename || 'monografia.docx'

    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '')
      }
    }

    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  },
}
