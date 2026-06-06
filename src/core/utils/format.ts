const TZ = import.meta.env.VITE_DEFAULT_TZ || "America/Bogota"

const dateTimeFmt = new Intl.DateTimeFormat("es-CO", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
})

/** Fecha/hora legible en la zona horaria configurada (America/Bogota). */
export function formatDateTime(iso?: string): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return dateTimeFmt.format(d)
}

/** Duración en ms a formato corto (p. ej. 1240 -> "1.24s", 80 -> "80ms"). */
export function formatDuration(ms?: number): string {
  if (ms == null || Number.isNaN(ms)) return "—"
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/** Iniciales para el avatar del usuario en la barra superior. */
export function initials(nombres?: string | null, apellidos?: string | null, email?: string): string {
  const a = (nombres ?? "").trim()
  const b = (apellidos ?? "").trim()
  if (a || b) return `${a.charAt(0)}${b.charAt(0)}`.toUpperCase() || "?"
  return (email ?? "?").charAt(0).toUpperCase()
}
