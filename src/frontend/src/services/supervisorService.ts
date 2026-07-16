import { req } from './apiClient'

export type SuperviseePhase = 'topic' | 'protocol' | 'none'

export interface SuperviseeStudent {
  id: number | null
  name: string | null
  email: string | null
  student_number?: string | null
  course?: {
    id: number
    name: string
    code?: string | null
  } | null
}

export interface SuperviseeTopic {
  id: number
  title: string
  justification?: string | null
  status: string
  status_label: string
  submitted_at?: string
  scientific_area?: {
    id: number
    name: string
  } | null
  course?: {
    id: number
    name: string
    code?: string | null
  } | null
}

export interface SuperviseeProtocol {
  id: number
  code: string
  status: string
  status_label: string
  protocol_type?: string
  submission_number?: number
  version?: string
  submitted_at?: string
  supervisor_decision_at?: string | null
}

export interface SuperviseeSubmission {
  type: 'topic' | 'protocol'
  id: number
  title?: string
  code?: string
  status: string
  status_label: string
  submitted_at?: string
}

export interface Supervisee {
  student: SuperviseeStudent
  phase: SuperviseePhase
  phase_label: string
  current_submission?: SuperviseeSubmission | null
  current_topic?: SuperviseeTopic | null
  current_protocol?: SuperviseeProtocol | null
}

export const supervisorService = {
  listSupervisees: () =>
    req('GET', '/api/v1/supervisor/supervisees') as Promise<{
      supervisees: Supervisee[]
      total: number
    }>,
}
