// src/services/generalAdminService.ts
import { req } from './apiClient'

export interface Coordinator {
  id: number
  user_id: number
  user?: { id: number; name: string; email: string; status: string }
  scientific_area_id: number
  scientific_area?: { id: number; name: string }
  course_id: number
  course?: { id: number; name: string; code: string }
  office?: string
  created_at: string
}

export interface Secretary {
  id: number
  user_id: number
  user?: { id: number; name: string; email: string; status: string }
  organ_id: number
  organ?: { id: number; name: string; type: string }
  scientific_area_id?: number | null
  office?: string
  created_at: string
}

export interface Course {
  id: number
  scientific_area_id: number
  name: string
  code: string
  description?: string
  scientific_area?: { id: number; name: string }
}

export interface ScientificArea {
  id: number
  organ_id: number
  name: string
  description?: string
  organ?: { id: number; name: string; type: string }
  created_at?: string
  updated_at?: string
}

export interface Organ {
  id: number
  name: string
  type: string
  description?: string
}

export interface User {
  id: number
  name: string
  email: string
  status: string
  roles?: { id: number; name: string }[]
}

// 🆕 Tipos para o Dashboard
export interface DashboardStats {
  total_coordinators: number
  total_secretaries: number
  total_presidents: number
  total_courses: number
  total_areas: number
  total_organs: number
  total_students: number
  total_teachers: number
  recent_activities: Activity[]
}

export interface Activity {
  id: number
  action: string
  description: string
  created_at: string
}

// Interface para resposta paginada do Laravel
interface PaginatedResponse<T> {
  current_page: number
  data: T[]
  first_page_url: string | null
  from: number | null
  last_page: number
  last_page_url: string | null
  links: Array<{ url: string | null; label: string; page: number | null; active: boolean }>
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

// Interface para resposta padrão da API
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

const BASE = '/api/v1'

export const generalAdminService = {

  // ⚠️ Sem rota 'dashboard' — nenhum controller a serve.

  // ── Coordinators ──────────────────────────────────────────
  listCoordinators: () =>
    req('GET', `${BASE}/coordinators`) as Promise<ApiResponse<Coordinator[]>>,

  // ⚠️ Sem GET /coordinators/{id} — AdminCoordinatorController não tem show()

  createCoordinator: (data: {
    name: string
    email: string
    scientific_area_id: number
    course_id: number
    office?: string
  }) =>
    req('POST', `${BASE}/coordinators`, data) as Promise<{
      message: string
      user: User & { coordinatorProfile?: any }
    }>,

  updateCoordinator: (id: number, data: {
    scientific_area_id?: number
    course_id?: number
    office?: string
  }) =>
    req('PUT', `${BASE}/coordinators/${id}`, data) as Promise<{ message: string; user: User }>,

  // 🆕 AINDA NÃO EXISTE NO BACKEND
  removeCoordinator: (id: number) =>
    req('DELETE', `${BASE}/coordinators/${id}`) as Promise<{ message: string }>,

  // ── Secretaries ───────────────────────────────────────────
  listSecretaries: () =>
    req('GET', `${BASE}/secretaries`) as Promise<ApiResponse<Secretary[]>>,

  createSecretary: (data: {
    name: string
    email: string
    scientific_area_id?: number | null
    office?: string
  }) =>
    // organ_id NÃO vai no payload: o AdminSecretaryController impõe
    // sempre o organ_id do executivo autenticado, nunca do request.
    req('POST', `${BASE}/secretaries`, data) as Promise<{ message: string; user: User }>,

  // 🆕 AINDA NÃO EXISTE NO BACKEND
  updateSecretary: (id: number, data: {
    scientific_area_id?: number | null
    office?: string
  }) =>
    req('PUT', `${BASE}/secretaries/${id}`, data) as Promise<{ message: string; user: User }>,

  // 🆕 AINDA NÃO EXISTE NO BACKEND
  removeSecretary: (id: number) =>
    req('DELETE', `${BASE}/secretaries/${id}`) as Promise<{ message: string }>,

  grantSecretaryPermission: (id: number, code: string) =>
    req('POST', `${BASE}/secretaries/${id}/permissions`, { code }) as Promise<{ message: string }>,

  revokeSecretaryPermission: (id: number, code: string) =>
    req('DELETE', `${BASE}/secretaries/${id}/permissions/${code}`) as Promise<{ message: string }>,

  // ── Executivos de órgão ("presidentes") ────────────────────
  // Não é um recurso à parte — é um User com adminProfile.
  // Usa o mesmo endpoint de users/store (mesma rota que adminService.createUser).
  createPresident: (data: { name: string; email: string; organ_id: number }) =>
    req('POST', `${BASE}/users`, data) as Promise<{ message: string; user: User }>,

  // 🆕 AINDA NÃO EXISTE NO BACKEND
  listOrganPresidents: () =>
    req('GET', `${BASE}/organ-presidents`) as Promise<ApiResponse<Secretary[]>>,

  // 🆕 AINDA NÃO EXISTE NO BACKEND
  removeOrganPresident: (id: number) =>
    req('DELETE', `${BASE}/organ-presidents/${id}`) as Promise<{ message: string }>,

  // ── Courses ────────────────────────────────────────
  listAllCourses: (page = 1) =>
    req('GET', `${BASE}/courses?page=${page}`) as Promise<ApiResponse<PaginatedResponse<Course>>>,

  createCourse: (data: { scientific_area_id: number; name: string; code: string; description?: string }) =>
    req('POST', `${BASE}/courses`, data) as Promise<{ message: string; course: Course }>,

  updateCourse: (id: number, data: {
    scientific_area_id?: number
    name?: string
    code?: string
    description?: string
  }) =>
    req('PUT', `${BASE}/courses/${id}`, data) as Promise<{ message: string; course: Course }>,

  deleteCourse: (id: number) =>
    req('DELETE', `${BASE}/courses/${id}`) as Promise<{ message: string }>,

  // ── Scientific Areas ──────────────────────────────────────
  listAllAreas: (page = 1) =>
    req('GET', `${BASE}/scientific-areas?page=${page}`) as Promise<ApiResponse<PaginatedResponse<ScientificArea>>>,

  createArea: (data: { organ_id: number; name: string; description?: string }) =>
    req('POST', `${BASE}/scientific-areas`, data) as Promise<{ message: string; area: ScientificArea }>,

  updateArea: (id: number, data: { organ_id?: number; name?: string; description?: string }) =>
    req('PUT', `${BASE}/scientific-areas/${id}`, data) as Promise<{ message: string; area: ScientificArea }>,

  deleteArea: (id: number) =>
    req('DELETE', `${BASE}/scientific-areas/${id}`) as Promise<{ message: string }>,

  // ── Users (para dropdowns) ────────────────────────────────
  listUsers: (params?: { role?: string; search?: string }) => {
    const query = new URLSearchParams()
    if (params?.role) query.append('role', params.role)
    if (params?.search) query.append('search', params.search)
    const qs = query.toString()
    return req('GET', `${BASE}/users${qs ? `?${qs}` : ''}`) as Promise<ApiResponse<User[]>>
  },

  // ── Organs (para dropdowns) ───────────────────────────────
  listOrgans: () =>
    req('GET', `${BASE}/organs`) as Promise<ApiResponse<Organ[]>>,

}