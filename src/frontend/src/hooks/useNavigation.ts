// src/hooks/useNavigation.ts
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NavigateOptions } from 'react-router-dom'

export function useNavigation() {
  const navigate = useNavigate()
  const [navigating, setNavigating] = useState(false)

  const navigateWithLoading = useCallback((to: string, options?: NavigateOptions) => {
    setNavigating(true)
    // Pequeno delay para mostrar o feedback
    setTimeout(() => {
      navigate(to, options)
      setNavigating(false)
    }, 300)
  }, [navigate])

  return { navigating, navigateWithLoading }
}