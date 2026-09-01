import type { AdminProfile, Role, UserPayload } from '../context/AuthContext'

export type OrganType =
  | 'nucleus'
  | 'scientific_committee'
  | 'bioethics_committee'
  | 'scientific_direction'

export interface AccessRule {
  permission?: string | null
  roles?: Role[] | null
  adminScope?: 'global' | 'organ'
  organTypes?: OrganType[]
}

export interface AccessContext {
  activeRole: Role | null
  permissions: string[]
  profiles: UserPayload['profiles']
}

function getActiveAdminProfile(context: AccessContext): AdminProfile | null {
  if (context.activeRole !== 'admin') {
    return null
  }

  return context.profiles.admin ?? null
}

function getActiveOrganType(context: AccessContext): OrganType | null {
  if (context.activeRole === 'admin') {
    return context.profiles.admin?.organ?.type as OrganType | undefined ?? null
  }

  if (context.activeRole === 'secretary') {
    return context.profiles.secretary?.organ?.type as OrganType | undefined ?? null
  }

  return null
}

export function canAccess(context: AccessContext, rule: AccessRule = {}): boolean {
  if (rule.roles?.length && (!context.activeRole || !rule.roles.includes(context.activeRole))) {
    return false
  }

  if (rule.permission && !context.permissions.includes(rule.permission)) {
    return false
  }

  if (rule.adminScope) {
    const adminProfile = getActiveAdminProfile(context)
    if (!adminProfile || adminProfile.access_scope !== rule.adminScope) {
      return false
    }
  }

  if (!rule.organTypes?.length) {
    return true
  }

  const organType = getActiveOrganType(context)
  return Boolean(organType && rule.organTypes.includes(organType))
}
