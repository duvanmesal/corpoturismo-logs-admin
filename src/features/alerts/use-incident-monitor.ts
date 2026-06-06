import { useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { logsApi } from "@/core/api/logs.api"
import { useAlertsStore } from "@/app/stores/alerts-store"

export interface Incident {
  active: boolean
  severity: "error" | "warn" | null
  errorCount: number
  warnCount: number
  windowMinutes: number
  isLoading: boolean
}

function countFor(byLevel: Array<{ level: string; count: number }> | undefined, level: string): number {
  return byLevel?.find((b) => b.level === level)?.count ?? 0
}

/**
 * Monitorea incidentes consultando los agregados recientes cada minuto. Levanta
 * un incidente cuando errores/warnings superan los umbrales configurados y, si
 * el usuario habilitó notificaciones del navegador, dispara una al activarse.
 */
export function useIncidentMonitor(): Incident {
  const { windowMinutes, errorThreshold, warnThreshold, notifyEnabled } = useAlertsStore()
  const wasActive = useRef(false)

  const { data, isLoading } = useQuery({
    queryKey: ["incident-monitor", windowMinutes],
    queryFn: () => {
      const from = new Date(Date.now() - windowMinutes * 60_000).toISOString()
      return logsApi.stats({ from })
    },
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    staleTime: 0,
    retry: false,
  })

  const byLevel = data?.data?.byLevel
  const errorCount = countFor(byLevel, "error")
  const warnCount = countFor(byLevel, "warn")

  const severity: Incident["severity"] =
    errorCount >= errorThreshold ? "error" : warnCount >= warnThreshold ? "warn" : null
  const active = severity !== null

  useEffect(() => {
    // Notificar solo en la transición inactivo -> activo.
    if (active && !wasActive.current && notifyEnabled) {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const body =
          severity === "error"
            ? `${errorCount} errores en los últimos ${windowMinutes} min`
            : `${warnCount} advertencias en los últimos ${windowMinutes} min`
        try {
          new Notification("Incidente de logs · Corpoturismo", { body })
        } catch {
          // Algunos navegadores requieren contexto de usuario; lo ignoramos.
        }
      }
    }
    wasActive.current = active
  }, [active, severity, errorCount, warnCount, windowMinutes, notifyEnabled])

  return { active, severity, errorCount, warnCount, windowMinutes, isLoading }
}
