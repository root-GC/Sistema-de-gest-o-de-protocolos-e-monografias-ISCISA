import { req } from './apiClient'

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type MeetingItemStatus = 'scheduled' | 'in_progress' | 'deliberated' | 'not_deliberated' | 'cancelled'

export interface DeliberationReviewer {
  id: number
  name: string
  email?: string | null
  is_primary: boolean
  is_me?: boolean
  assigned_at: string
  due_at: string
  days_remaining: number
  overdue: boolean
  review_status: 'reviewed' | 'not_reviewed'
  submitted_at?: string | null
}

export interface DeliberationProtocol {
  id: number
  code: string
  status: string
  title?: string | null
  student_name?: string | null
}

export interface DeliberationQueueEntry {
  evaluation_form_id: number
  protocol: DeliberationProtocol
  organ: { id: number; name: string; type: string }
  queue_entered_at: string
  waiting_days: number
  form_status: string
  reviewers: DeliberationReviewer[]
}

export interface DeliberationMeetingItem {
  id: number
  evaluation_form_id: number
  form_organ?: string
  queue_entered_at: string
  status: MeetingItemStatus
  started_at?: string | null
  completed_at?: string | null
  protocol: DeliberationProtocol
  form_status: string
  reviewers: DeliberationReviewer[]
  can_operate: boolean
}

export interface DeliberationMeeting {
  id: number
  organ: { id: number; name: string; type: string } | null
  scheduled_by: { id: number; name: string } | null
  scheduled_at: string
  location: string
  notes?: string | null
  status: MeetingStatus
  started_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
  cancellation_reason?: string | null
  can_manage: boolean
  items: DeliberationMeetingItem[]
}

export const deliberationService = {
  listQueue: (organId?: number) =>
    req('GET', `/api/v1/deliberation-queue${organId ? `?organ_id=${organId}` : ''}`) as Promise<{
      queue: DeliberationQueueEntry[]
    }>,

  listMeetings: (filters: { status?: MeetingStatus; from?: string; to?: string; organ_id?: number } = {}) => {
    const query = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value))
    })
    const suffix = query.size ? `?${query.toString()}` : ''
    return req('GET', `/api/v1/deliberation-meetings${suffix}`) as Promise<{ meetings: DeliberationMeeting[] }>
  },

  getMeeting: (meetingId: number) =>
    req('GET', `/api/v1/deliberation-meetings/${meetingId}`) as Promise<{ meeting: DeliberationMeeting }>,

  createMeeting: (payload: {
    scheduled_at: string
    location: string
    notes?: string | null
    evaluation_form_ids: number[]
    organ_id?: number
  }) => req('POST', '/api/v1/deliberation-meetings', payload) as Promise<{
    message: string
    meeting: DeliberationMeeting
  }>,

  rescheduleMeeting: (meetingId: number, payload: { scheduled_at: string; location: string; notes?: string | null }) =>
    req('PATCH', `/api/v1/deliberation-meetings/${meetingId}`, payload) as Promise<{
      message: string
      meeting: DeliberationMeeting
    }>,

  cancelMeeting: (meetingId: number, reason?: string | null) =>
    req('POST', `/api/v1/deliberation-meetings/${meetingId}/cancel`, { reason: reason || null }) as Promise<{
      message: string
      meeting: DeliberationMeeting
    }>,

  startMeeting: (meetingId: number) =>
    req('POST', `/api/v1/deliberation-meetings/${meetingId}/start`) as Promise<{
      message: string
      meeting: DeliberationMeeting
    }>,

  closeItem: (meetingId: number, itemId: number, result: 'deliberated' | 'not_deliberated') =>
    req('POST', `/api/v1/deliberation-meetings/${meetingId}/items/${itemId}/close`, { result }) as Promise<{
      message: string
      meeting: DeliberationMeeting
    }>,
}
