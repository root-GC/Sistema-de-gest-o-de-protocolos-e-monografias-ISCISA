// src/services/adminService.ts
import { req } from './apiClient'

export interface User {
  id: number
  name: string
  email: string
  status: string
  roles?: { id: number; name: string }[]
  permissions?: { id: number; name: string; code: string }[]
  profiles?: {
    admin?: {
      id: number
      organ_id: number
      organ?: Organ
    }
  }
}

export interface Role {
  id: number
  name: string
  description: string
  permissions?: Permission[]
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
  type: string
  description?: string
}

export interface ScientificArea {
  id: number
  name: string
  description?: string
  organ_id: number
  organ?: Organ
}

export interface Course {
  id: number
  name: string
  code: string
  description?: string
  scientific_area_id: number
  scientific_area?: ScientificArea
}

export const adminService = {
  // ── Users ──────────────────────────────────────────
  // ⚠️ /api/v1/users está registado DUAS VEZES (AdminUserController
  // com o duplo portão, e UserController com gate 'permission:admin.users').
  // Estes métodos assumem que o AdminUserController é o que fica.
  // Se decidires manter o UserController em vez disso, o payload de
  // createUser muda (aceita 'roles' array, não 'organ_id' obrigatório) —
  // avisa-me para eu reajustar.
  listUsers: (params?: { role?: string; search?: string; per_page?: number }) =>
    req('GET', '/api/v1/users', params) as Promise<{
      data: User[]
      total: number
      current_page: number
    }>,

  getUser: (id: number) =>
    req('GET', `/api/v1/users/${id}`) as Promise<{ data: User }>,

  createUser: (data: { name: string; email: string; organ_id: number }) =>
    req('POST', '/api/v1/users', data) as Promise<{ message: string; user: User }>,

  updateUser: (id: number, data: {
    name?: string
    email?: string
    status?: string
    organ_id?: number
  }) =>
    req('PUT', `/api/v1/users/${id}`, data) as Promise<{ message: string; user: User }>,

  deleteUser: (id: number) =>
    req('DELETE', `/api/v1/users/${id}`) as Promise<{ message: string }>,

  // ── Roles ──────────────────────────────────────────
  listRoles: () =>
    req('GET', '/api/v1/roles') as Promise<{ data: Role[] }>,

  getRole: (id: number) =>
    req('GET', `/api/v1/roles/${id}`) as Promise<{ data: Role }>,

  createRole: (data: { name: string; description: string; permissions: string[] }) =>
    req('POST', '/api/v1/roles', data) as Promise<{ message: string; role: Role }>,

  updateRole: (id: number, data: { name?: string; description?: string; permissions?: string[] }) =>
    req('PUT', `/api/v1/roles/${id}`, data) as Promise<{ message: string; role: Role }>,

  deleteRole: (id: number) =>
    req('DELETE', `/api/v1/roles/${id}`) as Promise<{ message: string }>,

  // ── Permissions ────────────────────────────────────
  listPermissions: () =>
    req('GET', '/api/v1/permissions') as Promise<{ data: Permission[] }>,

  // ── Organs (só leitura — sem store/update/destroy no backend hoje) ──
  listOrgans: () =>
    req('GET', '/api/v1/organs') as Promise<{ data: Organ[] }>,

  getOrgan: (id: number) =>
    req('GET', `/api/v1/organs/${id}`) as Promise<{ data: Organ }>,

  // ── Scientific Areas (módulo Organization) ──────────
  listScientificAreas: () =>
    req('GET', '/api/v1/scientific-areas') as Promise<{ data: ScientificArea[] }>,

  createScientificArea: (data: { name: string; organ_id: number; description?: string }) =>
    req('POST', '/api/v1/scientific-areas', data) as Promise<{ message: string; scientific_area: ScientificArea }>,

  updateScientificArea: (id: number, data: { name?: string; organ_id?: number; description?: string }) =>
    req('PUT', `/api/v1/scientific-areas/${id}`, data) as Promise<{ message: string; scientific_area: ScientificArea }>,

  deleteScientificArea: (id: number) =>
    req('DELETE', `/api/v1/scientific-areas/${id}`) as Promise<{ message: string }>,

  // ── Courses (módulo Organization) ───────────────────
  listCourses: () =>
    req('GET', '/api/v1/courses') as Promise<{ data: Course[] }>,

  createCourse: (data: { name: string; code: string; scientific_area_id: number; description?: string }) =>
    req('POST', '/api/v1/courses', data) as Promise<{ message: string; course: Course }>,

  updateCourse: (id: number, data: { name?: string; code?: string; scientific_area_id?: number; description?: string }) =>
    req('PUT', `/api/v1/courses/${id}`, data) as Promise<{ message: string; course: Course }>,

  deleteCourse: (id: number) =>
    req('DELETE', `/api/v1/courses/${id}`) as Promise<{ message: string }>,


  //
  //Ainda não existem
  
createOrgan: (data: { name: string; type: string; description?: string }) =>
  req('POST', '/api/v1/organs', data) as Promise<{ message: string; organ: Organ }>,

updateOrgan: (id: number, data: { name?: string; type?: string; description?: string }) =>
  req('PUT', `/api/v1/organs/${id}`, data) as Promise<{ message: string; organ: Organ }>,

deleteOrgan: (id: number) =>
  req('DELETE', `/api/v1/organs/${id}`) as Promise<{ message: string }>,
}