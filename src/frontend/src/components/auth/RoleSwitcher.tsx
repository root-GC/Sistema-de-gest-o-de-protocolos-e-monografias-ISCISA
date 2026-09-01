//components/auth/RoleSwitcher.tsx
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  if (!activeRole || roles.length === 0) return null;

  function handleChange(role: typeof activeRole) {
    if (!role || role === activeRole) return

    switchRole(role)
    navigate('/dashboard')
  }

  return (
    <label className="role-switcher">
      <span className="role-switcher__label">Perfil</span>
      <select
        className="role-switcher__select"
        value={activeRole}
        onChange={event => handleChange(event.target.value as typeof activeRole)}
        aria-label="Perfil ativo"
        disabled={roles.length === 1}
      >
        {roles.map(role => (
          <option key={role} value={role}>
            {ROLE_LABELS[role] ?? role}
          </option>
        ))}
      </select>
    </label>
  );
}
