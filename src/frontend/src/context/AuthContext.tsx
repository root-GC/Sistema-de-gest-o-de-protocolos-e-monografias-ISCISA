// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
// @ts-ignore
import { authService } from '../services/authService';

// ---------- Tipos ----------
export type Role =
  | 'student'
  | 'teacher'
  | 'supervisor'
  | 'reviewer'
  | 'coordinator'
  | 'secretary'
  | 'admin';

export interface CourseInfo {
  id: number;
  name: string;
  code?: string;
}

export interface ScientificAreaInfo {
  id: number;
  name: string;
}

export interface OrganInfo {
  id: number;
  name: string;
  type?: 'nucleus' | 'scientific_committee' | 'bioethics_committee' | 'scientific_direction';
}

export interface StudentProfile {
  id: number;
  student_number: string;
  supervisor_id: number;
  course: CourseInfo | null;
  scientific_area: ScientificAreaInfo | null;
}

export interface TeacherProfile {
  id: number;
  department?: string | null;
  academic_degree?: string | null;
  is_internal?: boolean;
  scientific_area: ScientificAreaInfo | null;
  course: CourseInfo | null;
}

export interface CoordinatorProfile {
  id: number;
  office?: string;
  course: CourseInfo | null;
  scientific_area: ScientificAreaInfo | null;
}

export interface SecretaryProfile {
  id: number;
  office?: string;
  organ: OrganInfo | null;
}

export interface AdminProfile {
  id: number;
  access_scope?: 'global' | 'organ';
  organ_id?: number;
  organ: OrganInfo | null;
}

export type Profile = 
  | StudentProfile 
  | TeacherProfile 
  | CoordinatorProfile 
  | SecretaryProfile 
  | AdminProfile 
  | null;

export interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  roles: Role[];
  permissions: string[];
  profiles: {
    student?: StudentProfile | null;
    teacher?: TeacherProfile | null;
    supervisor?: TeacherProfile | null;
    reviewer?: TeacherProfile | null;
    coordinator?: CoordinatorProfile | null;
    secretary?: SecretaryProfile | null;
    admin?: AdminProfile | null;
  };
}

interface AuthContextType {
  user: User | null;
  roles: Role[];
  permissions: string[];
  profiles: UserPayload['profiles'];
  activeRole: Role | null;
  activeProfile: Profile;
  loading: boolean;
  isProfileIncomplete: boolean;
  login: (email: string, password: string) => Promise<UserPayload>;
  completeAuth: (token: string, userData: UserPayload) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: Role) => void;
  refresh: () => Promise<void>;
  updateUser: (userData: UserPayload) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canAccessWidget: (requiredPermissions?: string[], anyPermission?: boolean) => boolean;
}

// ---------- Contexto ----------
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<UserPayload['profiles']>({});
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  // Hidratar sessão ao carregar
  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('sgpmc_token');
    const saved = localStorage.getItem('sgpmc_user');

    if (token && saved) {
      try {
        const userData = JSON.parse(saved) as UserPayload;
        hydrate(userData);

        authService.me()
          .then(({ user: refreshedUser }) => {
            if (cancelled) return;

            localStorage.setItem('sgpmc_user', JSON.stringify(refreshedUser));
            hydrate(refreshedUser);
          })
          .catch(() => undefined)
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      } catch {
        clear();
        window.setTimeout(() => {
          if (!cancelled) setLoading(false);
        }, 0);
      }
    } else {
      clear();
      window.setTimeout(() => {
        if (!cancelled) setLoading(false);
      }, 0);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  function hydrate(data: UserPayload) {
    setUser({ 
      id: data.id, 
      name: data.name, 
      email: data.email, 
      status: data.status 
    });
    setRoles(data.roles ?? []);
    setPermissions(data.permissions ?? []);
    setProfiles(data.profiles ?? {});

    // Verificar perfil incompleto
    checkProfileCompleteness(data);

    const savedRole = localStorage.getItem('sgpmc_active_role') as Role | null;
    const firstRole = data.roles?.[0] ?? null;
    
    const roleToSet = (savedRole && data.roles?.includes(savedRole)) 
      ? savedRole 
      : firstRole;
    
    setActiveRole(roleToSet);
    
  }

  // Verificar se o perfil do docente está completo
  function checkProfileCompleteness(data: UserPayload) {
    // Verificar se tem role "teacher"
    const hasTeacherRole = data.roles?.includes('teacher');
    
    if (!hasTeacherRole) {
      setIsProfileIncomplete(false);
      return;
    }
    
    // Verificar TeacherProfile
    const teacherProfile = data.profiles?.teacher;
    
    if (!teacherProfile) {
      setIsProfileIncomplete(true);
      return;
    }
    
    // Verificar campos obrigatórios (academic_degree e department)
    const isIncomplete = !teacherProfile.academic_degree || 
                         !teacherProfile.department ||
                         teacherProfile.academic_degree === null ||
                         teacherProfile.academic_degree === '' ||
                         teacherProfile.department === null ||
                         teacherProfile.department === '';
    
    setIsProfileIncomplete(isIncomplete);
    
  }

  const login = useCallback(async (email: string, password: string): Promise<UserPayload> => {
    setIsAuthenticating(true);
    try {
      const { token, user: userData } = await authService.login(email, password);

      localStorage.setItem('sgpmc_token', token);
      localStorage.setItem('sgpmc_user', JSON.stringify(userData));

      hydrate(userData);

      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 50);
      });

      return userData;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const completeAuth = useCallback(async (token: string, userData: UserPayload): Promise<void> => {
    setIsAuthenticating(true);
    try {
      localStorage.setItem('sgpmc_token', token);
      localStorage.setItem('sgpmc_user', JSON.stringify(userData));

      hydrate(userData);

      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 50);
      });
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignora erros
    } finally {
      clear();
    }
  }, []);

  const switchRole = useCallback((role: Role) => {
    if (!roles.includes(role)) {
      return;
    }
    setActiveRole(role);
    localStorage.setItem('sgpmc_active_role', role);
  }, [roles]);

  const refresh = useCallback(async () => {
    try {
      const { user: userData } = await authService.me();
      localStorage.setItem('sgpmc_user', JSON.stringify(userData));
      hydrate(userData);
    } catch {
      clear();
    }
  }, []);

  // Atualizar dados do utilizador (após completar perfil)
  const updateUser = useCallback((userData: UserPayload) => {
    localStorage.setItem('sgpmc_user', JSON.stringify(userData));
    
    setUser({ 
      id: userData.id, 
      name: userData.name, 
      email: userData.email, 
      status: userData.status 
    });
    setRoles(userData.roles ?? []);
    setPermissions(userData.permissions ?? []);
    setProfiles(userData.profiles ?? {});
    
    // Re-verificar perfil incompleto
    checkProfileCompleteness(userData);
  }, []);

  function clear() {
    localStorage.removeItem('sgpmc_token');
    localStorage.removeItem('sgpmc_user');
    localStorage.removeItem('sgpmc_active_role');
    setUser(null);
    setRoles([]);
    setPermissions([]);
    setProfiles({});
    setActiveRole(null);
    setIsProfileIncomplete(false);
  }

  const hasPermission = useCallback((permission: string): boolean => {
    return permissions.includes(permission);
  }, [permissions]);

  const hasAnyPermission = useCallback((perms: string[]): boolean => {
    return perms.some(p => permissions.includes(p));
  }, [permissions]);

  const hasAllPermissions = useCallback((perms: string[]): boolean => {
    return perms.every(p => permissions.includes(p));
  }, [permissions]);

  const canAccessWidget = useCallback((
    requiredPermissions?: string[],
    anyPermission?: boolean
  ): boolean => {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    if (anyPermission) {
      return hasAnyPermission(requiredPermissions);
    }
    return hasAllPermissions(requiredPermissions);
  }, [hasAnyPermission, hasAllPermissions]);

  const activeProfile = activeRole ? (profiles[activeRole] ?? null) : null;

  const isLoading = loading || isAuthenticating;

  const value = useMemo(() => ({
    user, roles, permissions, profiles, activeRole, activeProfile,
    loading: isLoading, isProfileIncomplete,
    login, completeAuth, logout, switchRole,
    refresh, updateUser,
    hasPermission, hasAnyPermission, hasAllPermissions, canAccessWidget,
  }), [user, roles, permissions, profiles, activeRole, activeProfile, isLoading, isProfileIncomplete, login, completeAuth, logout, switchRole, refresh, updateUser, hasPermission, hasAnyPermission, hasAllPermissions, canAccessWidget]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};
