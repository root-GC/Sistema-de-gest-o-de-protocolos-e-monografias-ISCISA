import { downloadApiFile, openApiFile, req, reqFormData } from './apiClient'

export interface MonographDocument {
  id: number
  file_name: string
  version: number
  status: string
  download_url: string | null
  created_at: string
}

export interface MonographOpinion {
  id: number
  organ: string
  decision: string
  version: number
  download_url: string | null
  evaluation_form_download_url: string | null
  created_at: string | null
}

export interface Monograph {
  id: number
  code: string
  title: string | null
  status: string
  status_label: string
  submission_number: number
  version: number
  student?: { id: number; name: string; email: string; student_number?: string }
  supervisor?: { id: number; name: string | null; email: string | null }
  topic?: { id: number; title: string }
  documents: MonographDocument[]
  created_at: string
  updated_at: string
}

export interface MonographListResponse { monographs: Monograph[] }
export interface MonographSubmitResponse { message?: string; monograph?: Monograph; data?: Monograph }
export interface MonographOpinionsResponse { opinions: MonographOpinion[] }

interface RawMonographListResponse {
  monographs?: Monograph[] | { data?: Monograph[] }
  data?: Monograph[]
}

function normalizeList(response: RawMonographListResponse): MonographListResponse {
  const nested = response.monographs
  const monographs = Array.isArray(nested)
    ? nested
    : nested?.data ?? response.data ?? []

  return { monographs }
}

export const monographService = {
  list: async (): Promise<MonographListResponse> =>
    normalizeList(await req<RawMonographListResponse>('GET', '/api/monographs')),

  // The same scoped endpoint serves the student, supervisor and nucleus secretary.
  listForSecretary: async (): Promise<MonographListResponse> =>
    normalizeList(await req<RawMonographListResponse>('GET', '/api/monographs')),

  get: (monographId: number) =>
    req<{ data?: Monograph }>('GET', `/api/monographs/${monographId}`),

  submit: (monographId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return reqFormData<MonographSubmitResponse>('POST', `/api/monographs/${monographId}/submit`, formData)
  },

  endorse: (monographId: number, approved: boolean, reason?: string) =>
    req<MonographSubmitResponse>('POST', `/api/monographs/${monographId}/endorse`, { approved, reason: reason || null }),

  verifyDocuments: (monographId: number, approved: boolean, reason?: string) =>
    req<MonographSubmitResponse>('POST', `/api/monographs/${monographId}/verify`, {
      role: 'secretary',
      approved,
      reason: reason || null,
    }),

  listOpinions: (monographId: number) =>
    req<MonographOpinionsResponse>('GET', `/api/monographs/${monographId}/opinions`),

  history: (monographId: number) =>
    req<unknown>('GET', `/api/monographs/${monographId}/history`),

  openFile: (url: string, fallbackFilename?: string) => openApiFile(url, fallbackFilename),
  downloadFile: (url: string, fallbackFilename?: string) => downloadApiFile(url, fallbackFilename),
}
