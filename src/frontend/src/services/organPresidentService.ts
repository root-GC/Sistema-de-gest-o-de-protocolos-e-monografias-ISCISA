// src/services/organPresidentService.ts
import { req } from './apiClient'

export interface OrganMember {
  id: number
  user_id: number
  organ_id: number
  role: string
  user?: {
    id: number
    name: string
    email: string
    status: string
  }
  organ?: {
    id: number
    name: string
    type: string
  }
  joined_at: string
}

export interface OrganInfo {
  id: number
  name: string
  type: string
  description?: string
  members_count: number
  president?: {
    id: number
    name: string
    email: string
  }
}

export interface OrganStats {
  total_members: number
  active_protocols: number
  completed_reviews: number
  pending_reviews: number
  members_by_role: Record<string, number>
}

export const organPresidentService = {

  // ── Organ Info ────────────────────────────────────────────
  getMyOrgan: () =>
    req('GET', '/api/v1/organ-president/my-organ') as Promise<{ data: OrganInfo }>,

  getOrganStats: () =>
    req('GET', '/api/v1/organ-president/stats') as Promise<{ data: OrganStats }>,

  // ── Members ───────────────────────────────────────────────
  listMembers: (params?: { role?: string; search?: string }) => {
    const query = new URLSearchParams()
    if (params?.role) query.append('role', params.role)
    if (params?.search) query.append('search', params.search)
    const qs = query.toString()
    return req('GET', `/api/v1/organ-president/members${qs ? `?${qs}` : ''}`) as Promise<{ data: OrganMember[] }>
  },

  addMember: (data: { user_id: number; role: string }) =>
    req('POST', '/api/v1/organ-president/members', data) as Promise<{ message: string; member: OrganMember }>,

  updateMemberRole: (memberId: number, role: string) =>
    req('PUT', `/api/v1/organ-president/members/${memberId}`, { role }) as Promise<{ message: string }>,

  removeMember: (memberId: number) =>
    req('DELETE', `/api/v1/organ-president/members/${memberId}`) as Promise<{ message: string }>,

  // ── Available Users (para adicionar) ──────────────────────
  searchUsers: (search: string) =>
    req('GET', `/api/v1/organ-president/search-users?search=${encodeURIComponent(search)}`) as Promise<{
      data: { id: number; name: string; email: string; status: string }[]
    }>,

  // ── Protocols (view only) ─────────────────────────────────
  getOrganProtocols: (params?: { status?: string; page?: number }) => {
    const query = new URLSearchParams()
    if (params?.status) query.append('status', params.status)
    if (params?.page) query.append('page', String(params.page))
    const qs = query.toString()
    return req('GET', `/api/v1/organ-president/protocols${qs ? `?${qs}` : ''}`) as Promise<{
      data: any[]
      total: number
    }>
  },
}