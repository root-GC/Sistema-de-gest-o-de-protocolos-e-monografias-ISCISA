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

export interface Teacher {
  id: number
  name: string
  email: string
  status: string
  academic_degree?: string | null
  scientific_area?: string | null
  scientific_area_id?: number | null
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

export interface OrganMember {
  id: number
  user_id: number
  organ_id: number
  role: string
  user?: { id: number; name: string; email: string; status: string }
  created_at: string
}

const BASE = '/api/v1'

export const organPresidentService = {

  // ── Órgão do presidente (do perfil) ────────────────────────
  // GET /api/v1/organs/{id} - EXISTE
  getMyOrgan: (organId: number) =>
    req('GET', `${BASE}/organs/${organId}`) as Promise<{ data: OrganInfo }>,

  // ── Secretárias do meu órgão ───────────────────────────────
  // AdminSecretaryController::index() filtra pelo organ_id do executivo autenticado
  // GET /api/v1/secretaries - EXISTE
  listSecretaries: () =>
    req('GET', `${BASE}/secretaries`) as Promise<{ data: Secretary[] }>,

  // Criar secretária para o meu órgão
  // POST /api/v1/secretaries - EXISTE
  createSecretary: (data: { name: string; email: string; scientific_area_id?: number | null; office?: string }) =>
    req('POST', `${BASE}/secretaries`, data) as Promise<{ message: string; user: any }>,

  // Atualizar secretária
  // PUT /api/v1/secretaries/{id} - EXISTE (AdminSecretaryController@update)
  updateSecretary: (id: number, data: { scientific_area_id?: number | null; office?: string }) =>
    req('PUT', `${BASE}/secretaries/${id}`, data) as Promise<{ message: string; user: any }>,

  // ── Permissões de secretárias ──────────────────────────────
  // POST /api/v1/secretaries/{id}/permissions - EXISTE
  grantPermission: (secretaryId: number, code: string) =>
    req('POST', `${BASE}/secretaries/${secretaryId}/permissions`, { code }) as Promise<{ message: string }>,

  // DELETE /api/v1/secretaries/{id}/permissions/{code} - EXISTE
  revokePermission: (secretaryId: number, code: string) =>
    req('DELETE', `${BASE}/secretaries/${secretaryId}/permissions/${code}`) as Promise<{ message: string }>,

  // ── Remover secretária ──────────────────────────────────────
  // DELETE /api/v1/secretaries/{id} - EXISTE (AdminSecretaryController@destroy)
  removeSecretary: (userId: number) =>
    req('DELETE', `${BASE}/secretaries/${userId}`) as Promise<{ message: string }>,

  // ── Organ Members (Gerir membros do órgão) ──────────────────
  // GET /api/v1/organ-members - NOVO (OrganMemberController@index)
  listOrganMembers: () =>
    req('GET', `${BASE}/organ-members`) as Promise<{ data: OrganMember[] }>,

  // GET /api/v1/organ-members/available-teachers - NOVO (OrganMemberController@availableTeachers)
  listAvailableTeachers: () =>
    req('GET', `${BASE}/organ-members/available-teachers`) as Promise<{ 
      data: Teacher[]
      total: number
      current_page: number
      last_page: number
    }>,

  // POST /api/v1/organ-members/invite - NOVO (OrganMemberController@invite)
  inviteReviewer: (userId: number) =>
    req('POST', `${BASE}/organ-members/invite`, { user_id: userId }) as Promise<{ 
      message: string
      member: OrganMember 
    }>,

  // PUT /api/v1/organ-members/{id} - NOVO (OrganMemberController@update)
  updateOrganMember: (id: number, data: { role: string }) =>
    req('PUT', `${BASE}/organ-members/${id}`, data) as Promise<{ 
      message: string
      member: OrganMember 
    }>,

  // DELETE /api/v1/organ-members/{id} - NOVO (OrganMemberController@destroy)
  removeOrganMember: (id: number) =>
    req('DELETE', `${BASE}/organ-members/${id}`) as Promise<{ message: string }>,

  // GET /api/v1/organ-members/{id} - NOVO (OrganMemberController@show)
  getOrganMember: (id: number) =>
    req('GET', `${BASE}/organ-members/${id}`) as Promise<{ data: OrganMember }>,

  // ── Dashboard / Stats ──────────────────────────────────────
  // NOTA: Não existe endpoint de stats específico para o órgão.
  // O frontend calcula as estatísticas a partir dos dados dos endpoints acima.
  // 
  // Para implementar no futuro:
  // GET /api/v1/organs/{id}/stats
  getOrganStats: (organId: number) =>
    req('GET', `${BASE}/organs/${organId}/stats`) as Promise<{ data: OrganStats }>,
    // ⚠️ ENDPOINT NÃO EXISTE - vai retornar 404
}

/**
 * ================================================================
 * RESUMO DOS ENDPOINTS
 * ================================================================
 * 
 * ✅ EXISTENTES (já implementados no backend):
 * - GET    /api/v1/organs/{id}                          → getMyOrgan()
 * - GET    /api/v1/secretaries                          → listSecretaries()
 * - POST   /api/v1/secretaries                          → createSecretary()
 * - PUT    /api/v1/secretaries/{id}                     → updateSecretary()
 * - POST   /api/v1/secretaries/{id}/permissions         → grantPermission()
 * - DELETE /api/v1/secretaries/{id}/permissions/{code}  → revokePermission()
 * - DELETE /api/v1/secretaries/{id}                     → removeSecretary()
 * 
 * 🆕 NOVOS (precisam do OrganMemberController):
 * - GET    /api/v1/organ-members                        → listOrganMembers()
 * - GET    /api/v1/organ-members/available-teachers     → listAvailableTeachers()
 * - POST   /api/v1/organ-members/invite                 → inviteReviewer()
 * - PUT    /api/v1/organ-members/{id}                   → updateOrganMember()
 * - DELETE /api/v1/organ-members/{id}                   → removeOrganMember()
 * - GET    /api/v1/organ-members/{id}                   → getOrganMember()
 * 
 * ⚠️ NÃO EXISTE (retornará 404):
 * - GET    /api/v1/organs/{id}/stats                    → getOrganStats()
 */