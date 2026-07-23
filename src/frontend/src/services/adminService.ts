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
  description?: string
  organ?: Organ
  courses?: Course[]
}

export interface Course {
  id: number
  scientific_area_id: number
  name: string
  code: string
  description?: string
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

export interface SystemMetrics {
  cpu: { usage_percent: number; cores: number; model: string }
  memory: { total_gb: number; used_gb: number; usage_percent: number; available_gb: number }
  disk: { total_gb: number; used_gb: number; usage_percent: number; free_gb: number }
  uptime: { days: number; hours: number; minutes: number; seconds: number; formatted: string }
  requests: { total: number; per_minute: number; avg_response_time_ms: number; error_rate_percent: number }
  database: { connections_active: number; connections_idle: number; connections_max: number; query_avg_time_ms: number; size_mb: number }
  cache: { hits_percent: number; misses: number; size_mb: number }
  queue: { pending: number; processing: number; failed: number }
}

export interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  uptime_formatted: string
  response_time_ms: number
  last_checked: string
}

export interface RecentLog {
  id: number
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  timestamp: string
  service: string
}

export interface SystemStats {
  total_users: number
  active_users: number
  total_students: number
  total_teachers: number
  total_protocols: number
  total_topics: number
  total_monographs: number
  protocols_by_status: Record<string, number>
  topics_by_status: Record<string, number>
  submissions_last_30_days: number
  avg_review_time_days: number
}

export interface AuditLog {
  id: number
  user_id: number
  user_name: string
  action: string
  entity_type: string
  entity_id: number
  details: string
  ip_address: string
  created_at: string
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
      data: User[]; total: number; current_page: number
    }>
  },

  getUser: (id: number) =>
    req('GET', `/api/v1/admin/users/${id}`) as Promise<{ data: User }>,

  // 🆕 createUser agora aceita organ_id
  createUser: (data: { name: string; email: string; password: string; roles: string[]; organ_id?: number }) =>
    req('POST', '/api/v1/admin/users', data) as Promise<{ message: string; user: User }>,

  // 🆕 updateUser agora aceita organ_id
  updateUser: (id: number, data: { name?: string; email?: string; status?: string; roles?: string[]; organ_id?: number }) =>
    req('PUT', `/api/v1/admin/users/${id}`, data) as Promise<{ message: string; user: User }>,

  deleteUser: (id: number) =>
    req('DELETE', `/api/v1/admin/users/${id}`) as Promise<{ message: string }>,

  inviteAdmin: (data: { name: string; email: string; organ_id: number }) =>
    req('POST', '/api/v1/admin/users/admins', data) as Promise<{ message: string; user: User }>,

  setPassword: (data: { email: string; token: string; password: string; password_confirmation: string }) =>
    req('POST', '/api/set-password', data) as Promise<{ message: string }>,

  // ── Roles ─────────────────────────────────────────────────
  listRoles: () => req('GET', '/api/v1/admin/roles') as Promise<{ data: Role[] }>,
  getRole: (id: number) => req('GET', `/api/v1/admin/roles/${id}`) as Promise<{ data: Role }>,
  createRole: (data: { name: string; description: string; permissions: string[] }) => req('POST', '/api/v1/admin/roles', data) as Promise<{ message: string; role: Role }>,
  updateRole: (id: number, data: { name?: string; description?: string; permissions?: string[] }) => req('PUT', `/api/v1/admin/roles/${id}`, data) as Promise<{ message: string; role: Role }>,
  deleteRole: (id: number) => req('DELETE', `/api/v1/admin/roles/${id}`) as Promise<{ message: string }>,

  // ── Permissions ───────────────────────────────────────────
  listPermissions: () => req('GET', '/api/v1/admin/permissions') as Promise<{ data: Permission[] }>,
  createPermission: (data: { code: string; description: string }) => req('POST', '/api/v1/admin/permissions', data) as Promise<{ message: string; permission: Permission }>,
  updatePermission: (id: number, data: { description: string }) => req('PUT', `/api/v1/admin/permissions/${id}`, data) as Promise<{ message: string }>,
  deletePermission: (id: number) => req('DELETE', `/api/v1/admin/permissions/${id}`) as Promise<{ message: string }>,

  // ── Organs ────────────────────────────────────────────────
  listOrgans: () => req('GET', '/api/v1/admin/organs') as Promise<{ data: Organ[] }>,
  getOrgan: (id: number) => req('GET', `/api/v1/admin/organs/${id}`) as Promise<{ data: Organ }>,
  createOrgan: (data: { name: string; type: string; description?: string }) => req('POST', '/api/v1/admin/organs', data) as Promise<{ message: string; organ: Organ }>,
  updateOrgan: (id: number, data: { name?: string; type?: string; description?: string }) => req('PUT', `/api/v1/admin/organs/${id}`, data) as Promise<{ message: string; organ: Organ }>,
  deleteOrgan: (id: number) => req('DELETE', `/api/v1/admin/organs/${id}`) as Promise<{ message: string }>,

  // ── Scientific Areas ──────────────────────────────────────
  listScientificAreas: (organId?: number) => {
    const query = organId ? `?organ_id=${organId}` : ''
    return req('GET', `/api/v1/admin/scientific-areas${query}`) as Promise<{ data: ScientificArea[] }>
  },
  getScientificArea: (id: number) => req('GET', `/api/v1/admin/scientific-areas/${id}`) as Promise<{ data: ScientificArea }>,
  createScientificArea: (data: { organ_id: number; name: string; description?: string }) => req('POST', '/api/v1/admin/scientific-areas', data) as Promise<{ message: string; scientific_area: ScientificArea }>,
  updateScientificArea: (id: number, data: { organ_id?: number; name?: string; description?: string }) => req('PUT', `/api/v1/admin/scientific-areas/${id}`, data) as Promise<{ message: string; scientific_area: ScientificArea }>,
  deleteScientificArea: (id: number) => req('DELETE', `/api/v1/admin/scientific-areas/${id}`) as Promise<{ message: string }>,

  // ── Courses ───────────────────────────────────────────────
  listCourses: (scientificAreaId?: number) => {
    const query = scientificAreaId ? `?scientific_area_id=${scientificAreaId}` : ''
    return req('GET', `/api/v1/admin/courses${query}`) as Promise<{ data: Course[] }>
  },
  getCourse: (id: number) => req('GET', `/api/v1/admin/courses/${id}`) as Promise<{ data: Course }>,
  createCourse: (data: { scientific_area_id: number; name: string; code: string; description?: string }) => req('POST', '/api/v1/admin/courses', data) as Promise<{ message: string; course: Course }>,
  updateCourse: (id: number, data: { scientific_area_id?: number; name?: string; code?: string; description?: string }) => req('PUT', `/api/v1/admin/courses/${id}`, data) as Promise<{ message: string; course: Course }>,
  deleteCourse: (id: number) => req('DELETE', `/api/v1/admin/courses/${id}`) as Promise<{ message: string }>,

  // ── Organ Members ─────────────────────────────────────────
  listOrganMembers: (organId: number) => req('GET', `/api/v1/admin/organs/${organId}/members`) as Promise<{ data: OrganMember[] }>,
  addOrganMember: (organId: number, data: { user_id: number; role: string }) => req('POST', `/api/v1/admin/organs/${organId}/members`, data) as Promise<{ message: string }>,
  removeOrganMember: (organId: number, userId: number) => req('DELETE', `/api/v1/admin/organs/${organId}/members/${userId}`) as Promise<{ message: string }>,

  // ── System Status & Monitoring ─────────────────────────
  getSystemMetrics: () => req('GET', '/api/v1/admin/system/metrics') as Promise<{ data: SystemMetrics }>,
  getSystemServices: () => req('GET', '/api/v1/admin/system/services') as Promise<{ data: ServiceStatus[] }>,
  getSystemLogs: (params?: { level?: string; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.level) query.append('level', params.level)
    if (params?.limit) query.append('limit', String(params.limit))
    const qs = query.toString()
    return req('GET', `/api/v1/admin/system/logs${qs ? `?${qs}` : ''}`) as Promise<{ data: RecentLog[] }>
  },

  // ── System Statistics ──────────────────────────────────
  getSystemStats: () => req('GET', '/api/v1/admin/system/stats') as Promise<{ data: SystemStats }>,
  getProtocolsByStatus: () => req('GET', '/api/v1/admin/system/stats/protocols-by-status') as Promise<{ data: Record<string, number> }>,
  getTopicsByStatus: () => req('GET', '/api/v1/admin/system/stats/topics-by-status') as Promise<{ data: Record<string, number> }>,
  getSubmissionsTrend: (days?: number) => {
    const query = days ? `?days=${days}` : ''
    return req('GET', `/api/v1/admin/system/stats/submissions-trend${query}`) as Promise<{ data: { date: string; count: number }[] }>
  },

  // ── Audit Logs ─────────────────────────────────────────
  getAuditLogs: (params?: { user_id?: number; action?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.user_id) query.append('user_id', String(params.user_id))
    if (params?.action) query.append('action', params.action)
    if (params?.page) query.append('page', String(params.page))
    if (params?.limit) query.append('limit', String(params.limit))
    const qs = query.toString()
    return req('GET', `/api/v1/admin/audit-logs${qs ? `?${qs}` : ''}`) as Promise<{ data: AuditLog[]; total: number; current_page: number }>
  },

  // ── Cache Management ───────────────────────────────────
  clearCache: (tag?: string) => req('POST', '/api/v1/admin/system/cache/clear', { tag }) as Promise<{ message: string }>,
  getCacheStats: () => req('GET', '/api/v1/admin/system/cache/stats') as Promise<{ data: { driver: string; size_mb: number; hits: number; misses: number; hit_rate_percent: number; keys_count: number } }>,

  // ── Queue Management ───────────────────────────────────
  getQueueStats: () => req('GET', '/api/v1/admin/system/queue/stats') as Promise<{ data: { pending: number; processing: number; completed: number; failed: number; failed_jobs: { id: number; queue: string; payload: string; failed_at: string }[] } }>,
  retryFailedJobs: () => req('POST', '/api/v1/admin/system/queue/retry-failed') as Promise<{ message: string; count: number }>,

  // ── Database Info ──────────────────────────────────────
  getDatabaseInfo: () => req('GET', '/api/v1/admin/system/database/info') as Promise<{ data: { driver: string; version: string; size_mb: number; tables_count: number; connections_active: number; connections_max: number; uptime_formatted: string } }>,

  // ── Backup Status ──────────────────────────────────────
  getBackupStatus: () => req('GET', '/api/v1/admin/system/backup/status') as Promise<{ data: { last_backup_at: string | null; last_backup_size_mb: number | null; next_backup_at: string | null; backups_count: number; status: 'ok' | 'warning' | 'error' } }>,
  triggerBackup: () => req('POST', '/api/v1/admin/system/backup/trigger') as Promise<{ message: string }>,
}