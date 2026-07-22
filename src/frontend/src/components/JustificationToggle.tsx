// src/components/JustificationToggle.tsx
import { useState } from 'react'

interface JustificationToggleProps {
  justification?: string | null
  label?: string
  showEmpty?: boolean
  compact?: boolean
  variant?: 'default' | 'supervisor' | 'reviewer'
}

export default function JustificationToggle({
  justification,
  label = 'Justificação',
  showEmpty = true,
  compact = true,
  variant = 'default'
}: JustificationToggleProps) {
  const [open, setOpen] = useState(false)
  const text = justification?.trim()

  if (!text && !showEmpty) return null

  // Cores baseadas na variante
  const colors = {
    default: {
      buttonColor: 'var(--primary)',
      buttonBg: 'var(--surface-container-lowest)',
      iconColor: 'var(--primary)',
      cardBg: 'var(--surface-container-low)',
      titleColor: 'var(--on-surface-variant)',
      textColor: 'var(--on-surface)',
      emptyTextColor: 'var(--on-surface-variant)',
    },
    supervisor: {
      buttonColor: 'var(--tertiary)',
      buttonBg: 'var(--tertiary-container)',
      iconColor: 'var(--tertiary)',
      cardBg: 'var(--tertiary-container)',
      titleColor: 'var(--on-tertiary-container)',
      textColor: 'var(--on-tertiary-container)',
      emptyTextColor: 'var(--on-tertiary-container)',
    },
    reviewer: {
      buttonColor: 'var(--secondary)',
      buttonBg: 'var(--secondary-container)',
      iconColor: 'var(--secondary)',
      cardBg: 'var(--secondary-container)',
      titleColor: 'var(--on-secondary-container)',
      textColor: 'var(--on-secondary-container)',
      emptyTextColor: 'var(--on-secondary-container)',
    },
  }

  const c = colors[variant]

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          width: 'fit-content',
          padding: compact ? '6px var(--space-2)' : '8px var(--space-3)',
          border: `1px solid ${c.iconColor}`,
          borderRadius: 'var(--radius-lg)',
          background: c.buttonBg,
          color: c.buttonColor,
          fontSize: compact ? 'var(--label-md)' : 'var(--body-md)',
          fontWeight: 'var(--font-medium)',
          fontFamily: 'var(--font-family)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          opacity: text ? 1 : 0.7
        }}
        onMouseEnter={e => {
          e.currentTarget.style.opacity = '1'
          e.currentTarget.style.boxShadow = 'var(--elevation-1)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.opacity = text ? '1' : '0.7'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: compact ? '18px' : '20px' }}>
          {text ? 'notes' : 'note_add'}
        </span>
        {open ? `Ocultar ${label.toLowerCase()}` : `Ver ${label.toLowerCase()}`}
        <span className="material-symbols-outlined" style={{ fontSize: compact ? '18px' : '20px' }}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-2)',
            padding: compact ? 'var(--space-2)' : 'var(--space-2) var(--space-3)',
            background: c.cardBg,
            border: `1px solid ${c.iconColor}`,
            borderRadius: 'var(--radius-lg)',
            color: c.textColor,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: compact ? '18px' : '20px',
              color: c.iconColor,
              marginTop: '2px',
              flexShrink: 0
            }}
          >
            {text ? 'notes' : 'info'}
          </span>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: 'var(--label-md)',
                fontWeight: 'var(--font-semibold)',
                color: c.titleColor,
                marginBottom: '4px',
                opacity: 0.8
              }}
            >
              {label}
            </p>
            <p
              style={{
                fontSize: compact ? 'var(--body-sm)' : 'var(--body-md)',
                color: text ? c.textColor : c.emptyTextColor,
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                lineHeight: 1.5,
                fontStyle: text ? 'normal' : 'italic'
              }}
            >
              {text || `Sem ${label.toLowerCase()} registada.`}
            </p>
            {text && (
              <p style={{
                fontSize: 'var(--label-sm)',
                color: c.titleColor,
                marginTop: 'var(--space-1)',
                opacity: 0.6
              }}>
                {text.length} caracteres
              </p>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}