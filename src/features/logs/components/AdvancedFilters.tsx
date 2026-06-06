import type { FormEvent } from "react"
import { SlidersHorizontal, Check, X } from "lucide-react"

export interface AdvancedDraft {
  service: string
  action: string
  userId: string
  requestId: string
  method: string
  statusCode: string
  module: string
  from: string
  to: string
}

export const emptyAdvancedDraft: AdvancedDraft = {
  service: "",
  action: "",
  userId: "",
  requestId: "",
  method: "",
  statusCode: "",
  module: "",
  from: "",
  to: "",
}

const METHODS = ["", "GET", "POST", "PUT", "PATCH", "DELETE"]

interface AdvancedFiltersProps {
  draft: AdvancedDraft
  onChange: (patch: Partial<AdvancedDraft>) => void
  onApply: () => void
  onClear: () => void
}

const fieldClass =
  "focus-ring h-9 w-full rounded-lg border border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface))] px-2.5 text-sm text-[rgb(var(--color-fg))] placeholder:text-[rgb(var(--color-muted))]"
const labelClass =
  "mb-1 block text-[0.6875rem] font-medium uppercase tracking-wide text-[rgb(var(--color-muted))]"

/** Campo etiqueta + control, compacto y reutilizado en el grid. */
function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}

export function AdvancedFilters({ draft, onChange, onApply, onClear }: AdvancedFiltersProps) {
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onApply()
  }

  return (
    <form onSubmit={submit} className="panel animate-fade-in-up p-4 sm:p-5">
      {/* Cabecera de la sección de filtros */}
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="h-3.5 w-3.5 text-[rgb(var(--color-primary))]" aria-hidden="true" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-fg-secondary))]">
          Filtros avanzados
        </h3>
      </div>

      {/* Grid responsive: 1 col móvil · 2 tablet · 3 desktop */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 md:grid-cols-3">
        <Field id="f-from" label="Desde">
          <input
            id="f-from"
            type="datetime-local"
            value={draft.from}
            onChange={(e) => onChange({ from: e.target.value })}
            className={fieldClass}
          />
        </Field>
        <Field id="f-to" label="Hasta">
          <input
            id="f-to"
            type="datetime-local"
            value={draft.to}
            onChange={(e) => onChange({ to: e.target.value })}
            className={fieldClass}
          />
        </Field>
        <Field id="f-service" label="Servicio">
          <input
            id="f-service"
            value={draft.service}
            onChange={(e) => onChange({ service: e.target.value })}
            placeholder="gestionguias-api"
            className={fieldClass}
          />
        </Field>
        <Field id="f-module" label="Módulo">
          <input
            id="f-module"
            value={draft.module}
            onChange={(e) => onChange({ module: e.target.value })}
            placeholder="auth, atenciones…"
            className={fieldClass}
          />
        </Field>
        <Field id="f-action" label="Evento">
          <input
            id="f-action"
            value={draft.action}
            onChange={(e) => onChange({ action: e.target.value })}
            placeholder="auth.login"
            className={fieldClass}
          />
        </Field>
        <Field id="f-user" label="User ID">
          <input
            id="f-user"
            value={draft.userId}
            onChange={(e) => onChange({ userId: e.target.value })}
            placeholder="ID del actor"
            className={fieldClass}
          />
        </Field>
        <Field id="f-method" label="Método">
          <select
            id="f-method"
            value={draft.method}
            onChange={(e) => onChange({ method: e.target.value })}
            className={fieldClass}
          >
            {METHODS.map((m) => (
              <option key={m || "all"} value={m}>
                {m || "Cualquiera"}
              </option>
            ))}
          </select>
        </Field>
        <Field id="f-status" label="Status code">
          <input
            id="f-status"
            inputMode="numeric"
            value={draft.statusCode}
            onChange={(e) => onChange({ statusCode: e.target.value })}
            placeholder="200, 404, 500…"
            className={fieldClass}
          />
        </Field>
        <Field id="f-rid" label="Request ID">
          <input
            id="f-rid"
            value={draft.requestId}
            onChange={(e) => onChange({ requestId: e.target.value })}
            placeholder="uuid de la petición"
            className={`${fieldClass} mono`}
          />
        </Field>
      </div>

      {/* Pie de acciones, alineado a la derecha y separado por un divisor */}
      <div className="mt-4 flex items-center justify-end gap-2 border-t border-[rgb(var(--color-border)/0.1)] pt-3">
        <button
          type="button"
          onClick={onClear}
          className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-[rgb(var(--color-muted))] transition-colors hover:bg-[rgb(var(--color-surface-2))] hover:text-[rgb(var(--color-fg-secondary))]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Limpiar filtros
        </button>
        <button
          type="submit"
          className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg bg-[rgb(var(--color-primary))] px-4 text-sm font-semibold text-[rgb(var(--color-bg))] transition-opacity hover:opacity-90"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          Aplicar filtros
        </button>
      </div>
    </form>
  )
}
