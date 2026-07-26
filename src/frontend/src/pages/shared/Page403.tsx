import { Link } from 'react-router-dom'
import '../../styles/global.css'

export default function Page403() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'var(--font-family)',
      color: 'var(--on-background)',
      background: 'var(--background)',
      padding: 'var(--space-4) var(--gutter)',
      textAlign: 'center'
    }}>
      {/* Círculo decorativo */}
      <div style={{
        width: '140px',
        height: '140px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--error-container)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 'var(--space-4)'
      }}>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: '72px',
            color: 'var(--error)',
            fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48"
          }}
        >
          lock
        </span>
      </div>

      {/* Código de erro */}
      <h1 style={{
        fontSize: 'var(--headline-xl)',
        fontWeight: 'var(--font-bold)',
        color: 'var(--on-surface)',
        marginBottom: 'var(--space-1)',
        letterSpacing: '-0.02em'
      }}>
        403
      </h1>

      {/* Título */}
      <h2 style={{
        fontSize: 'var(--headline-lg)',
        fontWeight: 'var(--font-semibold)',
        color: 'var(--on-surface)',
        marginBottom: 'var(--space-2)'
      }}>
        Acesso negado
      </h2>

      {/* Descrição */}
      <p style={{
        fontSize: 'var(--body-lg)',
        color: 'var(--on-surface-variant)',
        maxWidth: '480px',
        lineHeight: 1.6,
        marginBottom: 'var(--space-5)'
      }}>
        Não tem permissão para aceder a esta página.
        Se acredita que isto é um erro, contacte o administrador do sistema.
      </p>

      {/* Ações */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-2)',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <Link
          to="/dashboard"
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            padding: '12px var(--space-3)',
            fontSize: 'var(--body-md)',
            fontWeight: 'var(--font-semibold)',
            borderRadius: 'var(--radius-lg)',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--elevation-1)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dashboard</span>
          Ir para o início
        </Link>

        <Link
          to="/login"
          className="btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            padding: '12px var(--space-3)',
            fontSize: 'var(--body-md)',
            fontWeight: 'var(--font-semibold)',
            borderRadius: 'var(--radius-lg)',
            textDecoration: 'none',
            border: '1px solid var(--outline-variant)',
            background: 'var(--surface-container-lowest)',
            color: 'var(--on-surface)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--surface-container)'
            e.currentTarget.style.borderColor = 'var(--primary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--surface-container-lowest)'
            e.currentTarget.style.borderColor = 'var(--outline-variant)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>login</span>
          Iniciar sessão
        </Link>
      </div>

      {/* Footer */}
      <p style={{
        fontSize: 'var(--label-md)',
        color: 'var(--outline)',
        marginTop: 'var(--space-6)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }}>
        ISCISA • SGPMC
      </p>
    </div>
  )
}