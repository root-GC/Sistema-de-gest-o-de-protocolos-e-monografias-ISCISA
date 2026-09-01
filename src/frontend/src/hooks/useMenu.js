import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { menuRegistry } from '../registry/menuRegistry'
import { canAccess } from '../access/accessControl'

export function useMenu() {
  const { activeRole, permissions, profiles } = useAuth()

  return useMemo(() => {
    const context = { activeRole, permissions, profiles }

    return menuRegistry
      .filter(item => canAccess(context, item))
      .map(item => ({
        ...item,
        children: (item.children ?? []).filter(child => canAccess(context, child)),
      }))
  }, [activeRole, permissions, profiles])
}
