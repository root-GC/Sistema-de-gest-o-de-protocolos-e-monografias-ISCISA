import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

export interface Profile {
  course?: { name: string };
  scientific_area?: { name: string };
  organ?: { name: string };
}

export interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

interface UserPayload {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  roles: Role[];
  permissions: string[];
  profiles: Record<Role, Profile | null>;
}

interface AuthContextType {
  user: User | null;
  roles: Role[];
  permissions: string[];
  profiles: Record<Role, Profile | null>;
  activeRole: Role | null;
  activeProfile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserPayload>;
  logout: () => Promise<void>;
  switchRole: (role: Role) => void;
  refresh: () => Promise<void>;
}

// ---------- Contexto ----------
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Record<Role, Profile | null>>({} as Record<Role, Profile | null>);
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  // Hidratar sessão ao carregar
  useEffect(() => {
    const token = localStorage.getItem('sgpmc_token');
    const saved = localStorage.getItem('sgpmc_user');
    if (token && saved) {
      try {
        hydrate(JSON.parse(saved) as UserPayload);
      } catch {
        clear();
      }
    }
    setLoading(false);
  }, []);

  function hydrate(data: UserPayload) {
    setUser({ id: data.id, name: data.name, email: data.email, status: data.status });
    setRoles(data.roles ?? []);
    setPermissions(data.permissions ?? []);
    setProfiles(data.profiles ?? {});

    const saved = localStorage.getItem('sgpmc_active_role') as Role | null;
    const first = data.roles?.[0] ?? null;
    setActiveRole(data.roles?.includes(saved!) ? saved : first);
  }

  const login = useCallback(async (email: string, password: string): Promise<UserPayload> => {
    const { token, user: userData } = await authService.login(email, password);
    localStorage.setItem('sgpmc_token', token);
    localStorage.setItem('sgpmc_user', JSON.stringify(userData));
    hydrate(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {}
    clear();
  }, []);

  const switchRole = useCallback((role: Role) => {
    if (!roles.includes(role)) return;
    setActiveRole(role);
    localStorage.setItem('sgpmc_active_role', role);
  }, [roles]);

  const refresh = useCallback(async () => {
    try {
      const { user: userData } = await authService.me();
      localStorage.setItem('sgpmc_user', JSON.stringify(userData));
      hydrate(userData);
    } catch {}
  }, []);

  function clear() {
    localStorage.removeItem('sgpmc_token');
    localStorage.removeItem('sgpmc_user');
    localStorage.removeItem('sgpmc_active_role');
    setUser(null);
    setRoles([]);
    setPermissions([]);
    setProfiles({} as Record<Role, Profile | null>);
    setActiveRole(null);
  }

  const activeProfile = profiles[activeRole!] ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        permissions,
        profiles,
        activeRole,
        activeProfile,
        loading,
        login,
        logout,
        switchRole,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};