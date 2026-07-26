// src/pages/organ-president/organPresidentConfig.ts
export interface OrganPresidentConfig {
  label: string
  organType: string
  features: {
    manageMembers: boolean
    viewProtocols: boolean
    viewReports: boolean
  }
  memberRoles: string[]
}

export const ORGAN_PRESIDENT_CONFIGS: Record<string, OrganPresidentConfig> = {
  scientific_committee: {
    label: 'Comité Científico',
    organType: 'scientific_committee',
    features: {
      manageMembers: true,
      viewProtocols: true,
      viewReports: true,
    },
    memberRoles: ['president', 'vice_president', 'reviewer', 'member', 'secretary'],
  },
  bioethics_committee: {
    label: 'Comité de Bioética',
    organType: 'bioethics_committee',
    features: {
      manageMembers: true,
      viewProtocols: true,
      viewReports: true,
    },
    memberRoles: ['president', 'vice_president', 'reviewer', 'member', 'secretary'],
  },
}

export function getOrganConfig(organType: string): OrganPresidentConfig {
  return ORGAN_PRESIDENT_CONFIGS[organType] || {
    label: 'Órgão',
    organType: organType,
    features: {
      manageMembers: true,
      viewProtocols: false,
      viewReports: false,
    },
    memberRoles: ['president', 'member'],
  }
}