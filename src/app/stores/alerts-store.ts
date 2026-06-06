import { create } from "zustand"
import { persist } from "zustand/middleware"

// Configuración de alertas de incidentes (solo en-panel, sin backend).
// Persistida en localStorage para que sobreviva recargas.
interface AlertsState {
  windowMinutes: number
  errorThreshold: number
  warnThreshold: number
  // Notificaciones del navegador (requiere permiso del usuario).
  notifyEnabled: boolean
  update: (patch: Partial<Omit<AlertsState, "update">>) => void
}

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set) => ({
      windowMinutes: 15,
      errorThreshold: 10,
      warnThreshold: 25,
      notifyEnabled: false,
      update: (patch) => set(patch),
    }),
    { name: "logs-admin-alerts" },
  ),
)
