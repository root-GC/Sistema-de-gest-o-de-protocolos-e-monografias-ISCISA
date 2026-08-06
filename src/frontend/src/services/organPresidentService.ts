// src/services/organPresidentService.ts
import { req } from './apiClient'

export interface Secretary {
  id: number
  user_id: number
  organ_id: number
  scientific_area_id?: number | null
  office?: string
  user?: { id: number; name: string; email: string; status: string }
  organ?: { id: number; name: string; type: string }
}

// 🆕 Tipos para o Dashboard
export interface OrganInfo {
  id: number
  name: string
  type: string
  description?: string
  members_count: number
  president: {
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

// 🆕 Tipo para membros do órgão
export interface OrganMember {
  id: number
  user_id: number
  organ_id: number
  role: string
  user?: { id: number; name: string; email: string; status: string }
  joined_at: string
}

const BASE = '/api/v1'

export const organPresidentService = {

  // ⚠️ Sem rota 'my-organ' — deriva de GET /me (adminProfile.organ)
  // em vez de um endpoint dedicado, se precisares disto no imediato.

  // ⚠️ Sem rota 'stats' — nenhum controller calcula isto ainda.

  // ── Secretárias do meu órgão ───────────────────────────────
  // AdminSecretaryController::index() já filtra pelo organ_id
  // do executivo autenticado — não precisa de parâmetro.
  listMembers: () =>
    req('GET', `${BASE}/secretaries`) as Promise<{ data: Secretary[] }>,

  addMember: (data: { name: string; email: string; scientific_area_id?: number | null; office?: string }) =>
    req('POST', `${BASE}/secretaries`, data) as Promise<{ message: string; user: any }>,

  // 🆕 AINDA NÃO EXISTE NO BACKEND
  updateMemberRole: (memberId: number, role: string) =>
    req('PUT', `${BASE}/organ-members/${memberId}/role`, { role }) as Promise<{ message: string }>,

  // 🆕 AINDA NÃO EXISTE NO BACKEND
  removeMember: (memberId: number) =>
    req('DELETE', `${BASE}/organ-members/${memberId}`) as Promise<{ message: string }>,

  // ⚠️ Sem update de role — role fixa 'secretary' neste endpoint.
  // ⚠️ Sem DELETE — AdminSecretaryController não tem destroy() de secretária.

  grantPermission: (secretaryId: number, code: string) =>
    req('POST', `${BASE}/secretaries/${secretaryId}/permissions`, { code }) as Promise<{ message: string }>,

  revokePermission: (secretaryId: number, code: string) =>
    req('DELETE', `${BASE}/secretaries/${secretaryId}/permissions/${code}`) as Promise<{ message: string }>,

  // ⚠️ Sem 'search-users' nem 'protocols' — nenhum controller as serve.
}