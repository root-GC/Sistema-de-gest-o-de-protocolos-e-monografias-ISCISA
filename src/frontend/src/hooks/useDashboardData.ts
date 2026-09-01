import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { req } from '../services/apiClient'

interface WidgetState<T = unknown> {
  data: T | null
  isLoading: boolean
  error: string | null
}

type DashboardData = Record<string, WidgetState>

/**
 * Compatibility hook for older dashboards. Each widget reads its declared
 * endpoint; unavailable services appear as errors, never mock data.
 */
export function useDashboardData(widgetIds: string[], endpoints: Record<string, string>) {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData>({})
  const [isLoading, setIsLoading] = useState(Boolean(user && widgetIds.length))
  const [error, setError] = useState<string | null>(null)
  const widgetKey = useMemo(() => JSON.stringify(widgetIds), [widgetIds])
  const endpointKey = useMemo(() => JSON.stringify(endpoints), [endpoints])

  useEffect(() => {
    let cancelled = false
    const ids: string[] = JSON.parse(widgetKey)
    const paths: Record<string, string> = JSON.parse(endpointKey)

    if (!user || ids.length === 0) {
      setDashboardData({})
      setIsLoading(false)
      setError(null)
      return () => { cancelled = true }
    }

    setIsLoading(true)
    setError(null)
    setDashboardData(Object.fromEntries(ids.map(id => [id, { data: null, isLoading: true, error: null }])))

    Promise.all(ids.map(async id => {
      const endpoint = paths[id]
      if (!endpoint) return [id, { data: null, isLoading: false, error: 'Endpoint nao configurado.' }] as const

      try {
        const data = await req('GET', endpoint)
        return [id, { data, isLoading: false, error: null }] as const
      } catch (requestError) {
        return [id, { data: null, isLoading: false, error: (requestError as Error).message }] as const
      }
    })).then(results => {
      if (cancelled) return
      const next = Object.fromEntries(results) as DashboardData
      setDashboardData(next)
      setError(Object.values(next).find(widget => widget.error)?.error ?? null)
      setIsLoading(false)
    })

    return () => { cancelled = true }
  }, [endpointKey, user?.id, widgetKey])

  return { dashboardData, isLoading, error }
}
