import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':          'Início',
  '/topic':              'O meu tema',
  '/protocol/mine':      'O meu protocolo',
  '/monograph':          'Monografia',
  '/supervision':        'Tutorandos',
  '/reviews':            'Revisões',
  '/workload':           'A minha carga',
  '/protocols':          'Protocolos',
  '/protocols/assign':   'Atribuição de revisores',
  '/defense':            'Defesas',
  '/reports':            'Relatórios',
  '/secretary/protocols':'Gestão de submissões',
  '/admin/users':        'Utilizadores',
  '/admin/organs':       'Órgãos e áreas',
};

export function Topbar() {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const label = ROUTE_LABELS[pathname] ?? 'SGPMC';

  return (
    <header className="topbar">
      <span className="topbar-title">{label}</span>
      <div className="topbar-spacer" />
      <button className="topbar-logout" onClick={logout} aria-label="Terminar sessão">
        <i className="ti ti-logout" aria-hidden="true" />
        Sair
      </button>
    </header>
  );
}