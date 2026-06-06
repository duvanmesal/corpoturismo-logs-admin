import { useState } from "react"
import { BellRing, BellOff } from "lucide-react"
import { useAlertsStore } from "@/app/stores/alerts-store"

const fieldClass =
  "focus-ring w-full rounded-lg border border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface))] px-3 py-2 text-sm text-[rgb(var(--color-fg))]"
const labelClass = "mb-1 block text-xs font-medium text-[rgb(var(--color-muted))]"

function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window
}

export function AlertSettings() {
  const { windowMinutes, errorThreshold, warnThreshold, notifyEnabled, update } = useAlertsStore()
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    notificationsSupported() ? Notification.permission : "unsupported",
  )

  const toggleNotify = async () => {
    if (!notificationsSupported()) return
    if (notifyEnabled) {
      update({ notifyEnabled: false })
      return
    }
    let perm = Notification.permission
    if (perm === "default") perm = await Notification.requestPermission()
    setPermission(perm)
    update({ notifyEnabled: perm === "granted" })
  }

  const num = (v: string, min: number) => Math.max(min, Number(v) || min)

  return (
    <section className="panel p-5">
      <h2 className="text-sm font-semibold text-[rgb(var(--color-fg))]">Alertas de incidentes</h2>
      <p className="mt-0.5 text-xs text-[rgb(var(--color-muted))]">
        Se evalúa cada minuto sobre la actividad reciente.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="a-window">Ventana (min)</label>
          <input
            id="a-window"
            inputMode="numeric"
            value={windowMinutes}
            onChange={(e) => update({ windowMinutes: num(e.target.value, 1) })}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="a-err">Umbral errores</label>
          <input
            id="a-err"
            inputMode="numeric"
            value={errorThreshold}
            onChange={(e) => update({ errorThreshold: num(e.target.value, 1) })}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="a-warn">Umbral warnings</label>
          <input
            id="a-warn"
            inputMode="numeric"
            value={warnThreshold}
            onChange={(e) => update({ warnThreshold: num(e.target.value, 1) })}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-[rgb(var(--color-border)/0.12)] bg-[rgb(var(--color-bg))] px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[rgb(var(--color-fg-secondary))]">
            Notificaciones del navegador
          </p>
          <p className="text-xs text-[rgb(var(--color-muted))]">
            {permission === "unsupported"
              ? "Tu navegador no soporta notificaciones."
              : permission === "denied"
                ? "Permiso denegado en el navegador."
                : notifyEnabled
                  ? "Activas: recibirás un aviso al detectarse un incidente."
                  : "Desactivadas."}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleNotify}
          disabled={permission === "unsupported" || permission === "denied"}
          className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-lg border border-[rgb(var(--color-border)/0.16)] px-3 py-2 text-sm font-medium text-[rgb(var(--color-fg-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-2))] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {notifyEnabled ? <BellOff className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
          {notifyEnabled ? "Desactivar" : "Activar"}
        </button>
      </div>
    </section>
  )
}
