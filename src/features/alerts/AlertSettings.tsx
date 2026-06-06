import { useState } from "react"
import { BellRing, BellOff, Bell, Plus, Trash2, ToggleLeft, ToggleRight, PlayCircle, Loader2 } from "lucide-react"
import { useAlertsStore } from "@/app/stores/alerts-store"
import {
  useAlertRules,
  useAlertRulesEvaluate,
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule,
} from "./hooks/use-alert-rules"
import { useAuthStore } from "@/app/stores/auth-store"
import { Rol } from "@/core/models/auth"
import type { AlertRule, CreateAlertRuleInput } from "@/core/models/alert-rules"
import { extractApiError } from "@/core/utils/api-error"

const fieldClass =
  "focus-ring h-9 w-full rounded-lg border border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface))] px-3 text-sm text-[rgb(var(--color-fg))]"
const labelClass = "mb-1 block text-xs font-semibold text-[rgb(var(--color-fg-secondary))]"

function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window
}

const emptyRule: CreateAlertRuleInput = {
  name: "",
  level: "error",
  windowMinutes: 15,
  threshold: 10,
  service: "",
  module: "",
  enabled: true,
}

// ── Main component ─────────────────────────────────────────────────────────

export function AlertSettings() {
  const user = useAuthStore((s) => s.user)
  const isSuperAdmin = user?.rol === Rol.SUPER_ADMIN

  const { notifyEnabled, update } = useAlertsStore()
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    notificationsSupported() ? Notification.permission : "unsupported",
  )

  const rulesQuery = useAlertRules()
  const evaluateQuery = useAlertRulesEvaluate()
  const createMutation = useCreateAlertRule()
  const updateMutation = useUpdateAlertRule()
  const deleteMutation = useDeleteAlertRule()

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<CreateAlertRuleInput>(emptyRule)
  const [formError, setFormError] = useState<string | null>(null)

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

  const handleCreateRule = async () => {
    if (!formData.name.trim()) {
      setFormError("El nombre es obligatorio.")
      return
    }
    setFormError(null)
    try {
      await createMutation.mutateAsync({ ...formData, service: formData.service || undefined, module: formData.module || undefined })
      setShowForm(false)
      setFormData(emptyRule)
    } catch (e) {
      setFormError(extractApiError(e))
    }
  }

  const handleToggleEnabled = (rule: AlertRule) => {
    updateMutation.mutate({ id: rule.id, patch: { enabled: !rule.enabled } })
  }

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar esta regla de alerta?")) return
    deleteMutation.mutate(id)
  }

  const rules = rulesQuery.data?.data ?? []
  const evaluations = evaluateQuery.data?.data ?? []

  return (
    <section className="panel p-5">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgb(var(--color-warn)/0.12)]">
          <Bell className="h-4 w-4 text-[rgb(var(--color-warn))]" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="section-title">Reglas de alerta</h2>
          <p className="mt-0.5 text-xs text-[rgb(var(--color-muted))]">
            Evaluación on-demand sobre la actividad reciente
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => evaluateQuery.refetch()}
            disabled={evaluateQuery.isFetching}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface))] px-2.5 py-1.5 text-xs font-medium text-[rgb(var(--color-fg-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-2))] disabled:opacity-60"
          >
            {evaluateQuery.isFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Evaluar
          </button>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => { setShowForm((v) => !v); setFormError(null) }}
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-[rgb(var(--color-primary))] px-2.5 py-1.5 text-xs font-semibold text-[rgb(var(--color-bg))] transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Nueva
            </button>
          )}
        </div>
      </div>

      {/* Evaluation results */}
      {evaluations.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {evaluations.map((ev) => (
            <div
              key={ev.ruleId}
              className={[
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm",
                ev.triggered
                  ? "border-[rgb(var(--color-error)/0.3)] bg-[rgb(var(--color-error)/0.08)]"
                  : "border-[rgb(var(--color-border)/0.12)] bg-[rgb(var(--color-surface))]",
              ].join(" ")}
            >
              <span
                className={[
                  "h-2 w-2 shrink-0 rounded-full",
                  ev.triggered ? "bg-[rgb(var(--color-error))]" : "bg-[rgb(var(--color-muted))]",
                ].join(" ")}
              />
              <span className="min-w-0 flex-1 truncate font-medium text-[rgb(var(--color-fg))]">
                {ev.name}
              </span>
              <span
                className={[
                  "shrink-0 text-xs tabular-nums",
                  ev.triggered ? "text-[rgb(var(--color-error))]" : "text-[rgb(var(--color-muted))]",
                ].join(" ")}
              >
                {ev.count} / {ev.threshold}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* New rule form */}
      {showForm && isSuperAdmin && (
        <div className="mb-5 rounded-xl border border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-bg))] p-4">
          <p className="mb-3 text-sm font-semibold text-[rgb(var(--color-fg))]">Nueva regla</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="r-name">Nombre</label>
              <input
                id="r-name"
                className={fieldClass}
                value={formData.name}
                onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                placeholder="Ej. Errores críticos en producción"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="r-level">Nivel</label>
              <select
                id="r-level"
                className={fieldClass}
                value={formData.level}
                onChange={(e) => setFormData((d) => ({ ...d, level: e.target.value as "error" | "warn" }))}
              >
                <option value="error">Error</option>
                <option value="warn">Warn</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="r-window">Ventana (min)</label>
              <input
                id="r-window"
                type="number"
                min={1}
                max={1440}
                className={fieldClass}
                value={formData.windowMinutes}
                onChange={(e) => setFormData((d) => ({ ...d, windowMinutes: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="r-threshold">Umbral</label>
              <input
                id="r-threshold"
                type="number"
                min={1}
                className={fieldClass}
                value={formData.threshold}
                onChange={(e) => setFormData((d) => ({ ...d, threshold: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="r-service">Servicio (opcional)</label>
              <input
                id="r-service"
                className={fieldClass}
                value={formData.service ?? ""}
                onChange={(e) => setFormData((d) => ({ ...d, service: e.target.value }))}
                placeholder="Todos los servicios"
              />
            </div>
          </div>
          {formError && (
            <p className="mt-2 text-xs text-[rgb(var(--color-error))]">{formError}</p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleCreateRule}
              disabled={createMutation.isPending}
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-[rgb(var(--color-primary))] px-3 py-2 text-xs font-semibold text-[rgb(var(--color-bg))] transition-all hover:opacity-90 disabled:opacity-60"
            >
              {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormData(emptyRule); setFormError(null) }}
              className="focus-ring rounded-lg border border-[rgb(var(--color-border)/0.16)] px-3 py-2 text-xs font-medium text-[rgb(var(--color-fg-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-2))]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {rulesQuery.isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}
        </div>
      ) : rules.length === 0 ? (
        <p className="py-4 text-center text-xs text-[rgb(var(--color-muted))]">
          Sin reglas configuradas. {isSuperAdmin && "Crea una para empezar."}
        </p>
      ) : (
        <ul className="space-y-2">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center gap-3 rounded-xl border border-[rgb(var(--color-border)/0.12)] bg-[rgb(var(--color-bg))] px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      "inline-flex rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide",
                      rule.level === "error"
                        ? "bg-[rgb(var(--color-error)/0.12)] text-[rgb(var(--color-error))]"
                        : "bg-[rgb(var(--color-warn)/0.12)] text-[rgb(var(--color-warn))]",
                    ].join(" ")}
                  >
                    {rule.level}
                  </span>
                  <span className="truncate text-sm font-semibold text-[rgb(var(--color-fg))]">
                    {rule.name}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[rgb(var(--color-muted))]">
                  {rule.threshold}+ en {rule.windowMinutes} min
                  {rule.service && ` · ${rule.service}`}
                </p>
              </div>

              {isSuperAdmin && (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleEnabled(rule)}
                    disabled={updateMutation.isPending}
                    className="focus-ring rounded-lg p-1.5 transition-colors hover:bg-[rgb(var(--color-surface-2))]"
                    aria-label={rule.enabled ? "Desactivar regla" : "Activar regla"}
                  >
                    {rule.enabled ? (
                      <ToggleRight className="h-4 w-4 text-[rgb(var(--color-primary))]" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-[rgb(var(--color-muted))]" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(rule.id)}
                    disabled={deleteMutation.isPending}
                    className="focus-ring rounded-lg p-1.5 text-[rgb(var(--color-muted))] transition-colors hover:bg-[rgb(var(--color-error)/0.08)] hover:text-[rgb(var(--color-error))]"
                    aria-label="Eliminar regla"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              {!rule.enabled && (
                <span className="shrink-0 rounded-full border border-[rgb(var(--color-border)/0.16)] px-2 py-0.5 text-[0.625rem] text-[rgb(var(--color-muted))]">
                  inactiva
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Browser notification toggle */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[rgb(var(--color-border)/0.12)] bg-[rgb(var(--color-bg))] px-4 py-3.5">
        <div className="min-w-0 flex-1" style={{ minWidth: "180px" }}>
          <p className="text-sm font-semibold text-[rgb(var(--color-fg))]">
            Notificaciones del navegador
          </p>
          <p className="mt-0.5 text-xs text-[rgb(var(--color-muted))]">
            {permission === "unsupported"
              ? "Tu navegador no soporta notificaciones."
              : permission === "denied"
                ? "Permiso denegado — actívalo desde la configuración del navegador."
                : notifyEnabled
                  ? "Activas: recibirás un aviso al detectarse un incidente."
                  : "Desactivadas — haz clic para recibir alertas en tiempo real."}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleNotify}
          disabled={permission === "unsupported" || permission === "denied"}
          className={[
            "focus-ring inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            notifyEnabled
              ? "border-[rgb(var(--color-warn)/0.3)] bg-[rgb(var(--color-warn)/0.1)] text-[rgb(var(--color-warn))] hover:bg-[rgb(var(--color-warn)/0.15)]"
              : "border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-fg-secondary))] hover:bg-[rgb(var(--color-surface-2))]",
          ].join(" ")}
        >
          {notifyEnabled ? (
            <BellOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <BellRing className="h-4 w-4" aria-hidden="true" />
          )}
          {notifyEnabled ? "Desactivar" : "Activar"}
        </button>
      </div>
    </section>
  )
}
