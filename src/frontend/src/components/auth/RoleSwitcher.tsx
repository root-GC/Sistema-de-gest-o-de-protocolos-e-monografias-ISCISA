//components/auth/RoleSwitcher.tsx
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  student:     'Estudante',
  teacher:     'Docente',
  supervisor:  'Supervisor',
  reviewer:    'Revisor',
  coordinator: 'Coordenador',
  secretary:   'Secretário',
  admin:       'Administrador',
};

export function RoleSwitcher() {
  const { roles, activeRole, switchRole } = useAuth();

  if (roles.length <= 1) return null;

  return (
    <div className="role-switcher">
      <span className="role-switcher__label">Perfil activo</span>
      <div className="role-switcher__options">
        {roles.map(role => (
          <button
            key={role}
            className={`role-chip${activeRole === role ? ' role-chip--active' : ''}`}
            onClick={() => switchRole(role)}
            aria-pressed={activeRole === role}
          >
            {ROLE_LABELS[role] ?? role}
          </button>
        ))}
      </div>
    </div>
  );
}