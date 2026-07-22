// src/services/adminService.ts
import { req } from './apiClient'

// ============================================================
// INTERFACES
// ============================================================

export interface User {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive'
  created_at: string
  roles?: Role[]
  profiles?: {
    student?: any
    teacher?: any
    coordinator?: any
    secretary?: any
    admin?: any
  }
}

export interface Role {
  id: number
  name: string
  description: string
  permissions?: Permission[]
  users_count?: number
}

export interface Permission {
  id: number
  code: string
  description: string
  domain?: string
}

export interface Organ {
  id: number
  name: string
  type: 'nucleus' | 'scientific_committee' | 'bioethics_committee' | 'scientific_direction'
  description?: string
  created_at?: string
}

export interface ScientificArea {
  id: number
  organ_id: number
  name: string
  organ?: Organ
  courses?: Course[]
}

export interface Course {
  id: number
  scientific_area_id: number
  name: string
  code: string
  scientific_area?: ScientificArea
}

export interface OrganMember {
  id: number
  organ_id: number
  user_id: number
  role: string
  user?: User
  organ?: Organ
}

// ============================================================
// ADMIN SERVICE
// ============================================================

export const adminService = {

  // ── Users ─────────────────────────────────────────────────
  listUsers: (params?: { role?: string; search?: string; page?: number }) => {
    const query = new URLSearchParams()
    if (params?.role) query.append('role', params.role)
    if (params?.search) query.append('search', params.search)
    if (params?.page) query.append('page', String(params.page))
    const qs = query.toString()
    return req('GET', `/api/v1/admin/users${qs ? `?${qs}` : ''}`) as Promise<{
      data: User[]
      total: number
      current_page: number
    }>
  },

  getUser: (id: number) =>
    req('GET', `/api/v1/admin/users/${id}`) as Promise<{ data: User }>,

  createUser: (data: { name: string; email: string; password: string; roles: string[] }) =>
    req('POST', '/api/v1/admin/users', data) as Promise<{ message: string; user: User }>,

  updateUser: (id: number, data: { name?: string; email?: string; status?: string; roles?: string[] }) =>
    req('PUT', `/api/v1/admin/users/${id}`, data) as Promise<{ message: string; user: User }>,

  deleteUser: (id: number) =>
    req('DELETE', `/api/v1/admin/users/${id}`) as Promise<{ message: string }>,

  // ── Roles ─────────────────────────────────────────────────
  listRoles: () =>
    req('GET', '/api/v1/admin/roles') as Promise<{ data: Role[] }>,

  getRole: (id: number) =>
    req('GET', `/api/v1/admin/roles/${id}`) as Promise<{ data: Role }>,

  createRole: (data: { name: string; description: string; permissions: string[] }) =>
    req('POST', '/api/v1/admin/roles', data) as Promise<{ message: string; role: Role }>,

  updateRole: (id: number, data: { name?: string; description?: string; permissions?: string[] }) =>
    req('PUT', `/api/v1/admin/roles/${id}`, data) as Promise<{ message: string; role: Role }>,

  deleteRole: (id: number) =>
    req('DELETE', `/api/v1/admin/roles/${id}`) as Promise<{ message: string }>,

  // ── Permissions ───────────────────────────────────────────
  listPermissions: () =>
    req('GET', '/api/v1/admin/permissions') as Promise<{ data: Permission[] }>,

  // ── Organs ────────────────────────────────────────────────
  listOrgans: () =>
    req('GET', '/api/v1/admin/organs') as Promise<{ data: Organ[] }>,

  getOrgan: (id: number) =>
    req('GET', `/api/v1/admin/organs/${id}`) as Promise<{ data: Organ }>,

  createOrgan: (data: { name: string; type: string; description?: string }) =>
    req('POST', '/api/v1/admin/organs', data) as Promise<{ message: string; organ: Organ }>,

  updateOrgan: (id: number, data: { name?: string; type?: string; description?: string }) =>
    req('PUT', `/api/v1/admin/organs/${id}`, data) as Promise<{ message: string; organ: Organ }>,

  deleteOrgan: (id: number) =>
    req('DELETE', `/api/v1/admin/organs/${id}`) as Promise<{ message: string }>,

  // ── Scientific Areas ──────────────────────────────────────
  listScientificAreas: (organId?: number) => {
    const query = organId ? `?organ_id=${organId}` : ''
    return req('GET', `/api/v1/admin/scientific-areas${query}`) as Promise<{ data: ScientificArea[] }>
  },

  getScientificArea: (id: number) =>
    req('GET', `/api/v1/admin/scientific-areas/${id}`) as Promise<{ data: ScientificArea }>,

  createScientificArea: (data: { organ_id: number; name: string }) =>
    req('POST', '/api/v1/admin/scientific-areas', data) as Promise<{ message: string; scientific_area: ScientificArea }>,

  updateScientificArea: (id: number, data: { organ_id?: number; name?: string }) =>
    req('PUT', `/api/v1/admin/scientific-areas/${id}`, data) as Promise<{ message: string; scientific_area: ScientificArea }>,

  deleteScientificArea: (id: number) =>
    req('DELETE', `/api/v1/admin/scientific-areas/${id}`) as Promise<{ message: string }>,

  // ── Courses ───────────────────────────────────────────────
  listCourses: (scientificAreaId?: number) => {
    const query = scientificAreaId ? `?scientific_area_id=${scientificAreaId}` : ''
    return req('GET', `/api/v1/admin/courses${query}`) as Promise<{ data: Course[] }>
  },

  getCourse: (id: number) =>
    req('GET', `/api/v1/admin/courses/${id}`) as Promise<{ data: Course }>,

  createCourse: (data: { scientific_area_id: number; name: string; code: string }) =>
    req('POST', '/api/v1/admin/courses', data) as Promise<{ message: string; course: Course }>,

  updateCourse: (id: number, data: { scientific_area_id?: number; name?: string; code?: string }) =>
    req('PUT', `/api/v1/admin/courses/${id}`, data) as Promise<{ message: string; course: Course }>,

  deleteCourse: (id: number) =>
    req('DELETE', `/api/v1/admin/courses/${id}`) as Promise<{ message: string }>,

  // ── Organ Members ─────────────────────────────────────────
  listOrganMembers: (organId: number) =>
    req('GET', `/api/v1/admin/organs/${organId}/members`) as Promise<{ data: OrganMember[] }>,

  addOrganMember: (organId: number, data: { user_id: number; role: string }) =>
    req('POST', `/api/v1/admin/organs/${organId}/members`, data) as Promise<{ message: string }>,

  removeOrganMember: (organId: number, userId: number) =>
    req('DELETE', `/api/v1/admin/organs/${organId}/members/${userId}`) as Promise<{ message: string }>,
}