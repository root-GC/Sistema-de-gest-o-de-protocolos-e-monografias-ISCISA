// src/components/LoadingSpinner.tsx

interface LoadingSpinnerProps {
  text?: string
  size?: 'small' | 'medium' | 'large'
  variant?: 'page' | 'inline' | 'overlay'
}

export function LoadingSpinner({ 
  text = 'A carregar...', 
  size = 'medium',
  variant = 'inline' 
}: LoadingSpinnerProps) {
  
  if (variant === 'overlay') {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.2s ease'
      }}>
        <div style={{
          background: 'var(--surface-container-lowest)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-3)',
          boxShadow: 'var(--elevation-3)',
          minWidth: '200px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid var(--outline-variant)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{
            fontSize: 'var(--body-md)',
            color: 'var(--on-surface-variant)',
            fontWeight: 'var(--font-medium)',
            fontFamily: 'var(--font-family)'
          }}>
            {text}
          </p>
        </div>
      </div>
    )
  }

  if (variant === 'page') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 'var(--space-3)',
        color: 'var(--on-surface-variant)',
        fontFamily: 'var(--font-family)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--outline-variant)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{
          fontSize: 'var(--body-md)',
          animation: 'fadeInOut 2s ease-in-out infinite'
        }}>
          {text}
        </p>
      </div>
    )
  }

  // Inline
  const sizeMap = {
    small: { width: '16px', height: '16px', borderWidth: '2px' },
    medium: { width: '20px', height: '20px', borderWidth: '2px' },
    large: { width: '32px', height: '32px', borderWidth: '3px' },
  }

  const s = sizeMap[size]

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
      gap: 'var(--space-2)',
      color: 'var(--on-surface-variant)',
      fontSize: 'var(--body-md)',
      fontFamily: 'var(--font-family)'
    }}>
      <span style={{
        width: s.width,
        height: s.height,
        border: `${s.borderWidth} solid var(--outline-variant)`,
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block',
        flexShrink: 0
      }} />
      {text && <span>{text}</span>}
    </div>
  )
}

// Hook useLoading
import { useState, useCallback } from 'react'

export function useLoading(initialState = false) {
  const [loading, setLoading] = useState(initialState)

  const withLoading = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true)
    try {
      return await fn()
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, setLoading, withLoading }
}