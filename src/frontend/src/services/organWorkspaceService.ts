import { req } from './apiClient'
import type { SubmissionDocumentRequirement } from './protocolService'

export interface OrganWorkspaceOrgan {
  id: number
  name: string
  type: 'nucleus' | 'scientific_committee' | 'bioethics_committee'
  description?: string | null
}

export interface ReviewerPerformance {
  reviewer_id: number
  name: string | null
  assigned: number
  pending: number
  in_progress?: number
  completed: number
  overdue?: number
  average_completion_days: number | null
}

export interface OrganDashboard {
  kind: 'topics' | 'protocols'
  summary: Record<string, number>
  statuses: Record<string, number>
  reviewer_performance: ReviewerPerformance[]
  recent_activity: Array<{ id: number; action: string; description?: string | null; occurred_at: string; actor?: { name: string } | null }>
}

export interface OrganProcess {
  id: number
  code?: string
  title?: string
  status: string
  status_label: string
  submitted_at: string
  topic?: { title: string; course?: { name: string; code?: string } | null } | null
  course?: { name: string; code?: string } | null
  student?: { name: string; email?: string } | null
  reviewers: Array<{ id?: number; name?: string | null; assigned_at?: string; status?: string; decision?: string | null; submitted_at?: string | null }>
}

export interface OrganProtocolDetail extends OrganProcess {
  documents: Array<{ id: number; file_name: string; version_label?: string | null; download_url: string }>
  requirements: Array<{ id: number; name: string; description?: string | null; is_optional: boolean; sent: boolean; approved: boolean | null; rejection_reason?: string | null; download_url?: string | null }>
  evaluations: Array<{ id: number; version: string; status: string; final_decision?: string | null; conclusion_summary?: string | null; reviewers: Array<{ id: number; name?: string | null; status: string; decision?: string | null; comment?: string | null; submitted_at?: string | null; criteria: Array<{ criterion?: string | null; comment?: string | null }> }> }>
  history: Array<{ id: number; action: string; description?: string | null; occurred_at: string; actor?: { name: string } | null }>
}

export const organWorkspaceService = {
  dashboard: () => req('GET', '/api/v1/organ-workspace/dashboard') as Promise<{ organ: OrganWorkspaceOrgan; dashboard: OrganDashboard }>,
  processes: () => req('GET', '/api/v1/organ-workspace/processes') as Promise<{ kind: 'topics' | 'protocols'; data: OrganProcess[]; meta: { total: number } }>,
  protocol: (id: number) => req('GET', '/api/v1/organ-workspace/protocols/' + id) as Promise<{ protocol: OrganProtocolDetail }>,
  courses: () => req('GET', '/api/v1/organ-workspace/courses') as Promise<{ organ: OrganWorkspaceOrgan; courses: Array<{ id: number; code: string; name: string; scientific_area?: { name: string } | null }> }>,
  documentRequirements: () => req('GET', '/api/v1/organ-workspace/document-requirements') as Promise<{ organ: OrganWorkspaceOrgan; requirements: SubmissionDocumentRequirement[] }>,
  addDocumentRequirement: (payload: Pick<SubmissionDocumentRequirement, 'name' | 'description' | 'is_optional'>) =>
    req('POST', '/api/v1/organ-workspace/document-requirements', payload) as Promise<{ requirement: SubmissionDocumentRequirement }>,
  updateDocumentRequirement: (id: number, payload: Partial<Pick<SubmissionDocumentRequirement, 'name' | 'description' | 'is_optional' | 'is_active'>>) =>
    req('PATCH', '/api/v1/organ-workspace/document-requirements/' + id, payload) as Promise<{ requirement: SubmissionDocumentRequirement }>,
}
