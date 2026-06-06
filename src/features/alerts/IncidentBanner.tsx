import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { AlertOctagon, AlertTriangle, X, ArrowRight } from "lucide-react"
import type { Incident } from "./use-incident-monitor"

export function IncidentBanner({ incident }: { incident: Incident }) {
  const [dismissed, setDismissed] = useState(false)
  const wasActive = useRef(false)

  // Al reactivarse un incidente, volver a mostrar el banner aunque se hubiera cerrado.
  useEffect(() => {
    if (incident.active && !wasActive.current) setDismissed(false)
    wasActive.current = incident.active
  }, [incident.active])

  if (!incident.active || dismissed) return null

  const isError = incident.severity === "error"
  const token = isError ? "--color-error" : "--color-warn"
  const Icon = isError ? AlertOctagon : AlertTriangle
  const count = isError ? incident.errorCount : incident.warnCount
  const label = isError ? "errores" : "advertencias"

  return (
    <div
      role="alert"
      className="border-b"
      style={{
        backgroundColor: `rgb(var(${token}) / 0.12)`,
        borderColor: `rgb(var(${token}) / 0.3)`,
      }}
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2.5 sm:px-6">
        <Icon className="h-4 w-4 shrink-0" style={{ color: `rgb(var(${token}))` }} aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm" style={{ color: `rgb(var(${token}))` }}>
          <span className="font-semibold">Incidente activo:</span>{" "}
          <span className="tabular">{count}</span> {label} en los últimos {incident.windowMinutes} min.
        </p>
        <Link
          to="/logs"
          className="focus-ring inline-flex shrink-0 items-center gap-1 text-xs font-semibold hover:underline"
          style={{ color: `rgb(var(${token}))` }}
        >
          Revisar
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="focus-ring shrink-0 rounded p-1 opacity-70 hover:opacity-100"
          style={{ color: `rgb(var(${token}))` }}
          aria-label="Descartar aviso"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
