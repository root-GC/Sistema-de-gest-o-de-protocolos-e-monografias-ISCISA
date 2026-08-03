const BASE = import.meta.env.VITE_API_URL ?? ''

export interface RegistrationOption {
  id: number
  name: string
}

export interface SupervisorOption {
  id: number
  name: string
  academic_degree: 'licenciatura' | 'mestrado' | 'doutoramento'
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message ?? 'Erro ao carregar dados de registo.')
  return data as T
}

export const registrationDataService = {
  courses: () => get<RegistrationOption[]>('/api/register/courses'),
  scientificAreas: () => get<RegistrationOption[]>('/api/register/scientific-areas'),
  supervisors: () => get<SupervisorOption[]>('/api/register/supervisors'),
}
