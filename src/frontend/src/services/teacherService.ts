// src/services/teacherService.ts

import { apiClient } from './apiClient';
import type { UserPayload, TeacherProfile } from '../context/AuthContext';

// ==================== Tipos ====================

// Interface para o usuário retornado pelo backend
export interface TeacherUserResponse {
  id: number;
  name: string;
  email: string;
  status?: string;
  teacher_profile?: TeacherProfile | null;
  roles?: any[]; // Pode vir como array de objetos Role ou strings
}

// Interface para a resposta COMPLETA do backend
export interface TeacherProfileResponse {
  message?: string;
  data: TeacherUserResponse;
  permissions?: string[]; // 🔑 Permissions vem no TOPO da resposta, não dentro de "data"
  profile_complete: boolean;
}

export interface UpdateTeacherProfileData {
  name?: string;
  department?: string;
  academic_degree?: string;
}

// ==================== Constantes ====================

export const ACADEMIC_DEGREES = [
  'Licenciatura',
  'Mestrado',
  'Doutoramento',
] as const;

export type AcademicDegree = typeof ACADEMIC_DEGREES[number];

// ==================== Serviço ====================

export const teacherService = {
  /**
   * Buscar perfil do professor autenticado
   * GET /api/v1/teacher/profile
   */
  async getProfile(): Promise<TeacherProfileResponse> {
    const response = await apiClient.get<TeacherProfileResponse>('/api/v1/teacher/profile');
    return response;
  },

  /**
   * Atualizar perfil do professor
   * PUT /api/v1/teacher/profile
   */
  async updateProfile(data: UpdateTeacherProfileData): Promise<TeacherProfileResponse> {
    const response = await apiClient.put<TeacherProfileResponse>('/api/v1/teacher/profile', data);
    return response;
  },

  /**
   * Completar perfil do professor
   * (Método específico para quando o perfil está incompleto)
   */
  async completeProfile(data: UpdateTeacherProfileData): Promise<TeacherProfileResponse> {
    // Validações específicas para completar perfil
    if (!data.department || !data.academic_degree) {
      throw new Error('Departamento e grau académico são obrigatórios');
    }

    const response = await apiClient.put<TeacherProfileResponse>('/api/v1/teacher/profile', {
      ...data,
      department: data.department,
      academic_degree: data.academic_degree,
    });
    
    return response;
  },

  /**
   * Verificar se o perfil está completo
   * GET /api/v1/teacher/profile
   */
  async checkProfileStatus(): Promise<boolean> {
    try {
      const response = await this.getProfile();
      return response.profile_complete;
    } catch (error) {
      console.error('Erro ao verificar status do perfil:', error);
      return false;
    }
  },

  /**
   * Buscar áreas científicas (se necessário)
   * GET /api/v1/scientific-areas
   */
  async getScientificAreas(): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>('/api/v1/scientific-areas');
      return response;
    } catch (error) {
      console.error('Erro ao buscar áreas científicas:', error);
      return [];
    }
  },
};

// ==================== Helpers ====================

/**
 * Normalizar roles para array de strings
 * Aceita tanto array de strings quanto array de objetos Role
 */
function normalizeRoles(roles: any): string[] {
  if (!Array.isArray(roles)) {
    return [];
  }
  
  return roles.map((role: any) => {
    // Se já é string, retorna direto
    if (typeof role === 'string') {
      return role;
    }
    
    // Se é objeto, tenta extrair o nome
    if (role && typeof role === 'object') {
      // Verifica várias propriedades possíveis
      if (role.name && typeof role.name === 'string') {
        return role.name;
      }
      if (role.slug && typeof role.slug === 'string') {
        return role.slug;
      }
      if (role.role && typeof role.role === 'string') {
        return role.role;
      }
      if (role.id && typeof role.id === 'string') {
        return role.id;
      }
    }
    
    // Fallback: converte para string
    return String(role);
  }).filter(Boolean); // Remove valores vazios/undefined/null
}

/**
 * Converter resposta do backend para UserPayload
 * Recebe a resposta COMPLETA (não só response.data), porque
 * "permissions" vem ao nível do topo, não dentro de "data".
 */
export function teacherResponseToUserPayload(
  response: TeacherProfileResponse,
  currentUser?: UserPayload | null
): UserPayload {
  const user = response.data;

  // 🔑 CORREÇÃO: Normalizar roles garantindo que sejam strings
  const normalizedRoles = normalizeRoles(user.roles);
  
  // 🔑 CORREÇÃO: Se não houver roles normalizadas, usar as do currentUser
  const finalRoles = normalizedRoles.length > 0 
    ? normalizedRoles 
    : (currentUser?.roles || []);

  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    status: (user.status as 'active' | 'inactive') || 'active',
    roles: finalRoles as UserPayload['roles'],
    permissions: response.permissions || currentUser?.permissions || [],
    profiles: {
      ...(currentUser?.profiles || {}),
      teacher: user.teacher_profile || currentUser?.profiles?.teacher || null,
    },
  };
}

/**
 * Verificar se um perfil está completo baseado nos dados
 */
export function isTeacherProfileComplete(profile?: TeacherProfile | null): boolean {
  if (!profile) return false;
  
  return Boolean(
    profile.academic_degree && 
    profile.department
  );
}

/**
 * Formatar grau académico para exibição
 */
export function formatAcademicDegree(degree: string | null | undefined): string {
  if (!degree) return 'Não definido';
  
  const degreeMap: Record<string, string> = {
    'licenciatura': 'Licenciatura',
    'mestrado': 'Mestrado',
    'doutoramento': 'Doutoramento',
  };
  
  return degreeMap[degree.toLowerCase()] || degree;
}

export default teacherService;