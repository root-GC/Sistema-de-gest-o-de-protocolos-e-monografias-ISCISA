// src/components/GlobalLoader.tsx
import { useEffect, useState } from 'react'

export function GlobalLoader() {
  const [active, setActive] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handler = (e: Event) => {
      const { active: isActive } = (e as CustomEvent).detail
      
      if (isActive) {
        setActive(true)
        setProgress(0)
        // Simula progresso
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              clearInterval(interval)
              return 90
            }
            return prev + (90 - prev) * 0.15
          })
        }, 200)
      } else {
        setProgress(100)
        setTimeout(() => {
          setActive(false)
          setProgress(0)
        }, 300)
      }
    }

    window.addEventListener('global-loading', handler)
    return () => window.removeEventListener('global-loading', handler)
  }, [])

  if (!active && progress === 0) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '3px',
      zIndex: 10000,
      pointerEvents: 'none'
    }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        background: 'linear-gradient(90deg, var(--primary), var(--tertiary))',
        transition: 'width 0.3s ease',
        boxShadow: '0 0 8px rgba(0, 105, 51, 0.3)'
      }} />
    </div>
  )
}