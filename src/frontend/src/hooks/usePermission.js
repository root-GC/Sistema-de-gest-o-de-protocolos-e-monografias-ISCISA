import { useAuth } from '../context/AuthContext'

export function usePermission() {
  const { permissions, roles, activeRole } = useAuth()

  const can        = (p)    => permissions.includes(p)
  const canAny     = (list) => list.some(p  => permissions.includes(p))
  const canAll     = (list) => list.every(p => permissions.includes(p))
  const hasRole    = (r)    => roles.includes(r)
  const hasAnyRole = (list) => list.some(r  => roles.includes(r))
  const isRole     = (r)    => activeRole === r

  return { can, canAny, canAll, hasRole, hasAnyRole, isRole }
}