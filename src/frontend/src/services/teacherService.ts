// src/services/teacherService.ts

import { apiClient } from './apiClient';
import type { UserPayload, TeacherProfile } from '../context/AuthContext';

// ==================== Tipos ====================

// Interface para a resposta do backend (usuário com teacher_profile)
export interface TeacherUserResponse {
  id: number;
  name: string;
  email: string;
  status?: string;
  teacher_profile?: TeacherProfile | null;
  roles?: string[];
  permissions?: string[];
}

export interface TeacherProfileResponse {
  message?: string;
  data: TeacherUserResponse;  // ✅ Tipo correto do backend
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
 * Converter resposta do backend para UserPayload
 */
export function teacherResponseToUserPayload(
  response: TeacherUserResponse,
  currentUser?: UserPayload | null
): UserPayload {
  return {
    id: String(response.id),
    name: response.name,
    email: response.email,
    status: (response.status as 'active' | 'inactive') || 'active',
    roles: (response.roles as UserPayload['roles']) || currentUser?.roles || [],
    permissions: response.permissions || currentUser?.permissions || [],
    profiles: {
      ...(currentUser?.profiles || {}),
      teacher: response.teacher_profile || currentUser?.profiles?.teacher || null,
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