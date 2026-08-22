import { req } from './apiClient'

// ============================================================
// TIPOS
// ============================================================

export interface Secretary {
  id: number
  user_id: number
  organ_id: number
  scientific_area_id?: number | null
  office?: string

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

  user?: {
    id: number
    name: string
    email: string
    status: string
  }

  created_at: string
}

export interface TeacherRow {
  id: number
  name: string
  email: string
  status: 'pending' | 'active' | 'inactive'

  teacher_profile?: {
    department: string | null
    academic_degree: string | null

    scientific_area?: {
      id: number
      name: string
    }
  }
}

export interface ImportReport {
  message: string

  created: {
    line: number
    id: number
    name: string
    email: string
  }[]

  failed: {
    line: number
    row: Record<string, string>
    errors: string[]
  }[]
}

const BASE = '/api/v1'

export const organPresidentService = {
  // ============================================================
  // ÓRGÃO DO PRESIDENTE
  // ============================================================

  getMyOrgan: (organId: number) =>
    req(
      'GET',
      `${BASE}/organs/${organId}`
    ) as Promise<{
      data: OrganInfo
    }>,

  // ============================================================
  // SECRETÁRIAS
  // ============================================================

  listSecretaries: () =>
    req(
      'GET',
      `${BASE}/secretaries`
    ) as Promise<{
      data: Secretary[]
    }>,

  createSecretary: (
    data: {
      name: string
      email: string
      scientific_area_id?: number | null
      office?: string
    }
  ) =>
    req(
      'POST',
      `${BASE}/secretaries`,
      data
    ) as Promise<{
      message: string
      user: any
    }>,

  updateSecretary: (
    id: number,
    data: {
      scientific_area_id?: number | null
      office?: string
    }
  ) =>
    req(
      'PUT',
      `${BASE}/secretaries/${id}`,
      data
    ) as Promise<{
      message: string
      user: any
    }>,

  // ============================================================
  // PERMISSÕES
  // ============================================================

  grantPermission: (
    secretaryId: number,
    code: string
  ) =>
    req(
      'POST',
      `${BASE}/secretaries/${secretaryId}/permissions`,
      { code }
    ) as Promise<{
      message: string
    }>,

  revokePermission: (
    secretaryId: number,
    code: string
  ) =>
    req(
      'DELETE',
      `${BASE}/secretaries/${secretaryId}/permissions/${code}`
    ) as Promise<{
      message: string
    }>,

  // ============================================================
  // REMOVER SECRETÁRIA
  // ============================================================

  removeSecretary: (
    userId: number
  ) =>
    req(
      'DELETE',
      `${BASE}/secretaries/${userId}`
    ) as Promise<{
      message: string
    }>,

  // ============================================================
  // MEMBROS DO ÓRGÃO
  // ============================================================

  listOrganMembers: () =>
    req(
      'GET',
      `${BASE}/organ-members`
    ) as Promise<{
      data: OrganMember[]
    }>,

  listAvailableTeachers: () =>
    req(
      'GET',
      `${BASE}/organ-members/available-teachers`
    ) as Promise<{
      data: Teacher[]
      total: number
      current_page: number
      last_page: number
    }>,

  inviteReviewer: (
    userId: number
  ) =>
    req(
      'POST',
      `${BASE}/organ-members/invite`,
      { user_id: userId }
    ) as Promise<{
      message: string
      member: OrganMember
    }>,

  updateOrganMember: (
    id: number,
    data: { role: string }
  ) =>
    req(
      'PUT',
      `${BASE}/organ-members/${id}`,
      data
    ) as Promise<{
      message: string
      member: OrganMember
    }>,

  removeOrganMember: (
    id: number
  ) =>
    req(
      'DELETE',
      `${BASE}/organ-members/${id}`
    ) as Promise<{
      message: string
    }>,

  getOrganMember: (
    id: number
  ) =>
    req(
      'GET',
      `${BASE}/organ-members/${id}`
    ) as Promise<{
      data: OrganMember
    }>,

  // ============================================================
  // DOCENTES
  // ============================================================

  listTeachers: (
    params?: {
      search?: string
      page?: number
    }
  ) =>
    req(
      'GET',
      `${BASE}/admin/teachers`,
      params
    ) as Promise<{
      data: TeacherRow[]
      total: number
      current_page: number
    }>,

  /**
   * Cria um docente.
   *
   * IMPORTANTE:
   * O frontend NÃO envia scientific_area_id.
   *
   * O backend deve determinar automaticamente
   * a área científica a partir do órgão do
   * utilizador autenticado.
   */
  createTeacher: (
    data: {
      name: string
      email: string
    }
  ) =>
    req(
      'POST',
      `${BASE}/admin/teachers`,
      data
    ) as Promise<{
      message: string
      user: TeacherRow
    }>,

  /**
   * Importação em massa.
   *
   * O ficheiro deve conter apenas:
   *
   * name,nome,email
   *
   * A área científica também será determinada
   * pelo backend para todos os docentes importados.
   */
  importTeachers: (
    file: File
  ) => {
    const form = new FormData()

    form.append('file', file)

    return req(
      'POST',
      `${BASE}/admin/teachers/import`,
      form
    ) as Promise<ImportReport>
  },

  updateTeacher: (
    id: number,
    data: Partial<{
      name: string
      email: string
      status: string
    }>
  ) =>
    req(
      'PUT',
      `${BASE}/admin/teachers/${id}`,
      data
    ) as Promise<{
      message: string
      user: TeacherRow
    }>,

  removeTeacher: (
    id: number
  ) =>
    req(
      'DELETE',
      `${BASE}/admin/teachers/${id}`
    ) as Promise<{
      message: string
    }>,

  // ============================================================
  // DASHBOARD / STATS
  // ============================================================

  /**
   * ⚠️ Este endpoint ainda não existe no backend.
   */
  getOrganStats: (
    organId: number
  ) =>
    req(
      'GET',
      `${BASE}/organs/${organId}/stats`
    ) as Promise<{
      data: OrganStats
    }>,
}