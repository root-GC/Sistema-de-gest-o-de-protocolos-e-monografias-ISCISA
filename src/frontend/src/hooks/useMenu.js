import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { menuRegistry } from '../registry/menuRegistry'

export function useMenu() {
  const { permissions, roles } = useAuth()

  return useMemo(() => {
    return menuRegistry
      .filter(item => {
        if (!item.permission && !item.roles) return true  // dashboard
        const hasPerm = item.permission ? permissions.includes(item.permission) : false
        const hasRole = item.roles      ? item.roles.some(r => roles.includes(r)) : false
        return hasPerm || hasRole
      })
      .map(item => ({
        ...item,
        children: (item.children ?? []).filter(c =>
          !c.permission || permissions.includes(c.permission)
        ),
      }))
  }, [permissions, roles])
}