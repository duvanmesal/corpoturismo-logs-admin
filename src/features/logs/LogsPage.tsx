import { useMemo } from "react"
import type { FormEvent } from "react"
import { useSearchParams } from "react-router-dom"
import { RefreshCw, Search, X, ServerCrash, AlertTriangle, SlidersHorizontal } from "lucide-react"
import {
  LogLevel,
  type LogLevel as LogLevelType,
  type LogItem,
  type LogsListParams,
} from "@/core/models/logs"
import { useLogs } from "./hooks/use-logs"
import { LogsTable } from "./components/LogsTable"
import { LogDetailDrawer } from "./components/LogDetailDrawer"
import { ExportMenu } from "./components/ExportMenu"
import {
  AdvancedFilters,
  emptyAdvancedDraft,
  type AdvancedDraft,
} from "./components/AdvancedFilters"
import { Pagination } from "@/shared/components/Pagination"
import { PageHeader } from "@/shared/components/PageHeader"
import { extractApiError, extractApiErrorCode } from "@/core/utils/api-error"
import { logsApi, type LogsExportFilters } from "@/core/api/logs.api"
import { downloadBlob } from "@/core/utils/download"
import { useState } from "react"

const PAGE_SIZE = 25
const LEVEL_OPTIONS: Array<{ value: "" | LogLevelType; label: string }> = [
  { value: "", label: "Todos los niveles" },
  { value: LogLevel.debug, label: "Debug" },
  { value: LogLevel.info, label: "Info" },
  { value: LogLevel.warn, label: "Warn" },
  { value: LogLevel.error, label: "Error" },
]

function toIso(localValue: string): string | undefined {
  if (!localValue) return undefined
  const d = new Date(localValue)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

// Maps search-param string to AdvancedDraft fields
function paramsToAdvancedDraft(sp: URLSearchParams): AdvancedDraft {
  return {
    service: sp.get("service") ?? "",
    action: sp.get("action") ?? "",
    userId: sp.get("userId") ?? "",
    requestId: sp.get("requestId") ?? "",
    method: sp.get("method") ?? "",
    statusCode: sp.get("statusCode") ?? "",
    module: sp.get("module") ?? "",
    from: sp.get("from") ?? "",
    to: sp.get("to") ?? "",
  }
}

function draftToSearchParams(draft: AdvancedDraft): Record<string, string> {
  const out: Record<string, string> = {}
  if (draft.service) out.service = draft.service
  if (draft.action) out.action = draft.action
  if (draft.userId) out.userId = draft.userId
  if (draft.requestId) out.requestId = draft.requestId
  if (draft.method) out.method = draft.method
  if (draft.statusCode) out.statusCode = draft.statusCode
  if (draft.module) out.module = draft.module
  if (draft.from) out.from = draft.from
  if (draft.to) out.to = draft.to
  return out
}

function paramsToApiParams(sp: URLSearchParams): Partial<LogsListParams> {
  const statusCode = sp.get("statusCode")
  const sc = statusCode ? Number(statusCode) : undefined
  return {
    service: sp.get("service") || undefined,
    action: sp.get("action") || undefined,
    userId: sp.get("userId") || undefined,
    requestId: sp.get("requestId") || undefined,
    method: sp.get("method") || undefined,
    statusCode: sc && Number.isFinite(sc) ? sc : undefined,
    module: sp.get("module") || undefined,
    from: sp.get("from") ? toIso(sp.get("from")!) : undefined,
    to: sp.get("to") ? toIso(sp.get("to")!) : undefined,
  }
}

// Human-readable label for each filter chip
const CHIP_LABELS: Record<string, string> = {
  q: "Búsqueda",
  level: "Nivel",
  service: "Servicio",
  action: "Evento",
  userId: "Usuario",
  requestId: "Request ID",
  method: "Método",
  statusCode: "Código HTTP",
  module: "Módulo",
  from: "Desde",
  to: "Hasta",
}

const ADVANCED_KEYS = ["service", "action", "userId", "requestId", "method", "statusCode", "module", "from", "to"]

export function LogsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [draft, setDraft] = useState<AdvancedDraft>(() => paramsToAdvancedDraft(searchParams))

  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // Derive all filter state from URL
  const page = Number(searchParams.get("page") ?? "1")
  const level = (searchParams.get("level") ?? "") as "" | LogLevelType
  const q = searchParams.get("q") ?? ""
  const advanced = paramsToApiParams(searchParams)

  function setParam(key: string, value: string | null) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      next.set("page", "1")
      return next
    })
  }

  function removeChip(key: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete(key)
      next.set("page", "1")
      return next
    })
    if (key === "q") setSearchInput("")
    if (ADVANCED_KEYS.includes(key)) {
      setDraft((d) => ({ ...d, [key === "action" ? "action" : key]: "" }))
    }
  }

  const params: LogsListParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      order: "desc",
      level: level || undefined,
      q: q || undefined,
      ...advanced,
    }),
    [page, level, q, JSON.stringify(advanced)], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const { data, isLoading, isFetching, isError, error, refetch } = useLogs(params)

  const logs = data?.data ?? []
  const meta = data?.meta ?? null

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; value: string }> = []
    for (const [key, val] of searchParams.entries()) {
      if (key === "page") continue
      const label = CHIP_LABELS[key] ?? key
      chips.push({ key, label, value: String(val) })
    }
    return chips
  }, [searchParams])

  const hasActiveFilters = activeChips.length > 0

  const canExport = Boolean(advanced.from && advanced.to)

  const onSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    setParam("q", searchInput.trim() || null)
  }

  const onApplyAdvanced = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      // Clear old advanced params
      for (const k of ADVANCED_KEYS) next.delete(k)
      // Set new ones
      const applied = draftToSearchParams(draft)
      for (const [k, v] of Object.entries(applied)) next.set(k, v)
      next.set("page", "1")
      return next
    })
  }

  const onClearFilters = () => {
    setSearchInput("")
    setDraft(emptyAdvancedDraft)
    setSearchParams({})
    setExportError(null)
  }

  const handleExport = async (format: "csv" | "json") => {
    if (!advanced.from || !advanced.to) return
    setExportError(null)
    setIsExporting(true)
    try {
      const filters: LogsExportFilters = {
        ...advanced,
        from: advanced.from,
        to: advanced.to,
        level: level || undefined,
        q: q || undefined,
      }
      const blob = await logsApi.export(filters, format)
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
      downloadBlob(blob, `logs-${stamp}.${format}`)
    } catch (e) {
      setExportError(extractApiError(e))
    } finally {
      setIsExporting(false)
    }
  }

  const errorCode = isError ? extractApiErrorCode(error) : undefined
  const isServiceIssue =
    errorCode === "SERVICE_UNAVAILABLE" ||
    errorCode === "BAD_GATEWAY" ||
    errorCode === "GATEWAY_TIMEOUT" ||
    errorCode === "LOGS_SERVICE_AUTH_ERROR"

  return (
    <div className="space-y-5">
      <PageHeader
        title="Registros de actividad"
        subtitle="Consulta de logs operativos del sistema en tiempo casi real."
      >
        <ExportMenu canExport={canExport} isExporting={isExporting} onExport={handleExport} />
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="focus-ring inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface))] px-3 py-2 text-sm font-medium text-[rgb(var(--color-fg-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-2))] disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
          Refrescar
        </button>
      </PageHeader>

      {exportError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-[rgb(var(--color-error)/0.25)] bg-[rgb(var(--color-error)/0.1)] px-3 py-2 text-sm text-[rgb(var(--color-error))]"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {exportError}
        </div>
      )}

      {/* Quick filter bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <form
          onSubmit={onSearchSubmit}
          className="focus-within-ring flex h-10 min-w-[12rem] flex-1 items-center gap-2 rounded-lg border border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface))] px-3 sm:max-w-sm"
        >
          <Search className="h-4 w-4 shrink-0 text-[rgb(var(--color-muted))]" aria-hidden="true" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar evento o mensaje…"
            className="h-full w-full min-w-0 border-0 bg-transparent text-sm text-[rgb(var(--color-fg))] outline-none placeholder:text-[rgb(var(--color-muted))] [&::-webkit-search-cancel-button]:appearance-none"
          />
        </form>

        <select
          value={level}
          onChange={(e) => setParam("level", e.target.value || null)}
          className="focus-ring h-10 rounded-lg border border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface))] px-3 text-sm text-[rgb(var(--color-fg))]"
          aria-label="Filtrar por nivel"
        >
          {LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          className={[
            "focus-ring inline-flex h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-colors",
            showAdvanced || ADVANCED_KEYS.some((k) => searchParams.has(k))
              ? "border-[rgb(var(--color-primary)/0.4)] bg-[rgb(var(--color-primary)/0.1)] text-[rgb(var(--color-primary))]"
              : "border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-fg-secondary))] hover:bg-[rgb(var(--color-surface-2))]",
          ].join(" ")}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filtros
          {ADVANCED_KEYS.filter((k) => searchParams.has(k)).length > 0 && (
            <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-full bg-[rgb(var(--color-primary))] px-1.5 text-[0.6875rem] font-semibold text-[rgb(var(--color-bg))]">
              {ADVANCED_KEYS.filter((k) => searchParams.has(k)).length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="focus-ring inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-[rgb(var(--color-muted))] transition-colors hover:bg-[rgb(var(--color-surface-2))] hover:text-[rgb(var(--color-fg-secondary))]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map(({ key, label, value }) => (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface))] px-2.5 py-1 text-xs font-medium text-[rgb(var(--color-fg-secondary))]"
            >
              <span className="text-[rgb(var(--color-muted))]">{label}:</span>
              <span className="max-w-[12rem] truncate">{value}</span>
              <button
                type="button"
                onClick={() => removeChip(key)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-[rgb(var(--color-surface-2))] hover:text-[rgb(var(--color-fg))]"
                aria-label={`Eliminar filtro ${label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {showAdvanced && (
        <AdvancedFilters
          draft={draft}
          onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
          onApply={onApplyAdvanced}
          onClear={onClearFilters}
        />
      )}

      <div className="panel overflow-hidden">
        {isError ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgb(var(--color-error)/0.12)] ring-1 ring-[rgb(var(--color-error)/0.22)]">
              {isServiceIssue ? (
                <ServerCrash className="h-6 w-6 text-[rgb(var(--color-error))]" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-[rgb(var(--color-error))]" aria-hidden="true" />
              )}
            </div>
            <p className="text-sm font-medium text-[rgb(var(--color-fg-secondary))]">
              {extractApiError(error)}
            </p>
            {errorCode && (
              <p className="mono text-xs text-[rgb(var(--color-muted))]">{errorCode}</p>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              className="focus-ring mt-1 inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border)/0.16)] px-3 py-2 text-sm font-medium text-[rgb(var(--color-fg-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-2))]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <LogsTable
              logs={logs}
              isLoading={isLoading}
              pageSize={PAGE_SIZE}
              onRowClick={setSelectedLog}
            />
            {meta && meta.total > 0 && (
              <Pagination
                meta={meta}
                onPageChange={(p) => setParam("page", String(p))}
                disabled={isFetching}
              />
            )}
          </>
        )}
      </div>

      <LogDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  )
}
