// src/services/generalAdminService.ts
import { req } from './apiClient'

// ============================================================
// INTERFACES
// ============================================================

export interface Coordinator {
  id: number
  user_id: number
  user?: {
    id: number
    name: string
    email: string
    status: string
  }
  scientific_area_id: number
  scientific_area?: {
    id: number
    name: string
  }
  course_id: number
  course?: {
    id: number
    name: string
    code: string
  }
  office?: string
  created_at: string
}

export interface Secretary {
  id: number
  user_id: number
  user?: {
    id: number
    name: string
    email: string
    status: string
  }
  organ_id: number
  organ?: {
    id: number
    name: string
    type: string
  }
  office?: string
  created_at: string
}

export interface OrganPresident {
  id: number
  user_id: number
  user?: {
    id: number
    name: string
    email: string
    status: string
  }
  organ_id: number
  organ?: {
    id: number
    name: string
    type: string
  }
  appointed_at: string
}

export interface Course {
  id: number
  scientific_area_id: number
  name: string
  code: string
  description?: string
  scientific_area?: {
    id: number
    name: string
  }
}

export interface ScientificArea {
  id: number
  organ_id: number
  name: string
  description?: string
  organ?: {
    id: number
    name: string
    type: string
  }
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

export interface DashboardStats {
  total_coordinators: number
  total_secretaries: number
  total_presidents: number
  total_courses: number
  total_areas: number
  total_organs: number
  total_students: number
  total_teachers: number
  recent_activities: {
    id: number
    action: string
    description: string
    created_at: string
  }[]
}

// ============================================================
// GENERAL ADMIN SERVICE
// ============================================================

export const generalAdminService = {

  // ── Dashboard ─────────────────────────────────────────────
  getDashboardStats: () =>
    req('GET', '/api/v1/general-admin/dashboard') as Promise<{ data: DashboardStats }>,

  // ── Coordinators ──────────────────────────────────────────
  listCoordinators: () =>
    req('GET', '/api/v1/general-admin/coordinators') as Promise<{ data: Coordinator[] }>,

  getCoordinator: (id: number) =>
    req('GET', `/api/v1/general-admin/coordinators/${id}`) as Promise<{ data: Coordinator }>,

  createCoordinator: (data: {
    user_id: number
    scientific_area_id: number
    course_id: number
    office?: string
  }) =>
    req('POST', '/api/v1/general-admin/coordinators', data) as Promise<{ message: string; coordinator: Coordinator }>,

  updateCoordinator: (id: number, data: {
    scientific_area_id?: number
    course_id?: number
    office?: string
  }) =>
    req('PUT', `/api/v1/general-admin/coordinators/${id}`, data) as Promise<{ message: string; coordinator: Coordinator }>,

  removeCoordinator: (id: number) =>
    req('DELETE', `/api/v1/general-admin/coordinators/${id}`) as Promise<{ message: string }>,

  // ── Secretaries ───────────────────────────────────────────
  listSecretaries: () =>
    req('GET', '/api/v1/general-admin/secretaries') as Promise<{ data: Secretary[] }>,

  getSecretary: (id: number) =>
    req('GET', `/api/v1/general-admin/secretaries/${id}`) as Promise<{ data: Secretary }>,

  createSecretary: (data: {
    user_id: number
    organ_id: number
    office?: string
  }) =>
    req('POST', '/api/v1/general-admin/secretaries', data) as Promise<{ message: string; secretary: Secretary }>,

  updateSecretary: (id: number, data: {
    organ_id?: number
    office?: string
  }) =>
    req('PUT', `/api/v1/general-admin/secretaries/${id}`, data) as Promise<{ message: string; secretary: Secretary }>,

  removeSecretary: (id: number) =>
    req('DELETE', `/api/v1/general-admin/secretaries/${id}`) as Promise<{ message: string }>,

  // ── Organ Presidents ──────────────────────────────────────
  listOrganPresidents: () =>
    req('GET', '/api/v1/general-admin/organ-presidents') as Promise<{ data: OrganPresident[] }>,

  getOrganPresident: (id: number) =>
    req('GET', `/api/v1/general-admin/organ-presidents/${id}`) as Promise<{ data: OrganPresident }>,

  appointOrganPresident: (data: {
    user_id: number
    organ_id: number
  }) =>
    req('POST', '/api/v1/general-admin/organ-presidents', data) as Promise<{ message: string; president: OrganPresident }>,

  removeOrganPresident: (id: number) =>
    req('DELETE', `/api/v1/general-admin/organ-presidents/${id}`) as Promise<{ message: string }>,

  // ── Courses Management ────────────────────────────────────
  listAllCourses: () =>
    req('GET', '/api/v1/general-admin/courses') as Promise<{ data: Course[] }>,

  createCourse: (data: {
    scientific_area_id: number
    name: string
    code: string
    description?: string
  }) =>
    req('POST', '/api/v1/general-admin/courses', data) as Promise<{ message: string; course: Course }>,

  updateCourse: (id: number, data: {
    scientific_area_id?: number
    name?: string
    code?: string
    description?: string
  }) =>
    req('PUT', `/api/v1/general-admin/courses/${id}`, data) as Promise<{ message: string; course: Course }>,

  deleteCourse: (id: number) =>
    req('DELETE', `/api/v1/general-admin/courses/${id}`) as Promise<{ message: string }>,

  // ── Scientific Areas ──────────────────────────────────────
  listAllAreas: () =>
    req('GET', '/api/v1/general-admin/scientific-areas') as Promise<{ data: ScientificArea[] }>,

  createArea: (data: {
    organ_id: number
    name: string
    description?: string
  }) =>
    req('POST', '/api/v1/general-admin/scientific-areas', data) as Promise<{ message: string; area: ScientificArea }>,

  updateArea: (id: number, data: {
    organ_id?: number
    name?: string
    description?: string
  }) =>
    req('PUT', `/api/v1/general-admin/scientific-areas/${id}`, data) as Promise<{ message: string; area: ScientificArea }>,

  deleteArea: (id: number) =>
    req('DELETE', `/api/v1/general-admin/scientific-areas/${id}`) as Promise<{ message: string }>,

  // ── Users (para dropdowns) ────────────────────────────────
  listUsers: (params?: { role?: string; search?: string }) => {
    const query = new URLSearchParams()
    if (params?.role) query.append('role', params.role)
    if (params?.search) query.append('search', params.search)
    const qs = query.toString()
    return req('GET', `/api/v1/general-admin/users${qs ? `?${qs}` : ''}`) as Promise<{ data: User[] }>
  },

  // ── Organs (para dropdowns) ───────────────────────────────
  listOrgans: () =>
    req('GET', '/api/v1/general-admin/organs') as Promise<{ data: Organ[] }>,
}