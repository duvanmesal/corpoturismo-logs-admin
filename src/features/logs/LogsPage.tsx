import { useMemo, useState } from "react"
import type { FormEvent } from "react"
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
import { extractApiError, extractApiErrorCode } from "@/core/utils/api-error"
import { logsApi, type LogsExportFilters } from "@/core/api/logs.api"
import { downloadBlob } from "@/core/utils/download"

const PAGE_SIZE = 25
const LEVEL_OPTIONS: Array<{ value: "" | LogLevelType; label: string }> = [
  { value: "", label: "Todos los niveles" },
  { value: LogLevel.debug, label: "Debug" },
  { value: LogLevel.info, label: "Info" },
  { value: LogLevel.warn, label: "Warn" },
  { value: LogLevel.error, label: "Error" },
]

/** Convierte un valor de <input datetime-local> a ISO UTC, o undefined. */
function toIso(localValue: string): string | undefined {
  if (!localValue) return undefined
  const d = new Date(localValue)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

/** Filtros avanzados aplicados, ya normalizados al contrato del proxy. */
function draftToParams(d: AdvancedDraft): Partial<LogsListParams> {
  const statusCode = d.statusCode.trim() ? Number(d.statusCode.trim()) : undefined
  return {
    service: d.service.trim() || undefined,
    action: d.action.trim() || undefined,
    userId: d.userId.trim() || undefined,
    requestId: d.requestId.trim() || undefined,
    method: d.method || undefined,
    statusCode: Number.isFinite(statusCode) ? statusCode : undefined,
    module: d.module.trim() || undefined,
    from: toIso(d.from),
    to: toIso(d.to),
  }
}

export function LogsPage() {
  const [page, setPage] = useState(1)
  const [level, setLevel] = useState<"" | LogLevelType>("")
  const [searchInput, setSearchInput] = useState("")
  const [q, setQ] = useState("")

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [draft, setDraft] = useState<AdvancedDraft>(emptyAdvancedDraft)
  const [advanced, setAdvanced] = useState<Partial<LogsListParams>>({})

  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null)

  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const params: LogsListParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      order: "desc",
      level: level || undefined,
      q: q || undefined,
      ...advanced,
    }),
    [page, level, q, advanced],
  )

  const { data, isLoading, isFetching, isError, error, refetch } = useLogs(params)

  const logs = data?.data ?? []
  const meta = data?.meta ?? null

  const advancedCount = Object.values(advanced).filter((v) => v != null && v !== "").length
  const hasActiveFilters = level !== "" || q !== "" || advancedCount > 0

  const onSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    setPage(1)
    setQ(searchInput.trim())
  }

  const onApplyAdvanced = () => {
    setPage(1)
    setAdvanced(draftToParams(draft))
  }

  const onClearFilters = () => {
    setSearchInput("")
    setQ("")
    setLevel("")
    setDraft(emptyAdvancedDraft)
    setAdvanced({})
    setPage(1)
    setExportError(null)
  }

  // El export exige rango de fechas (lo valida también el backend).
  const canExport = Boolean(advanced.from && advanced.to)

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[rgb(var(--color-fg))]">
            Registros de actividad
          </h1>
          <p className="mt-0.5 text-sm text-[rgb(var(--color-muted))]">
            Consulta de logs operativos del sistema en tiempo casi real.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {exportError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-[rgb(var(--color-error)/0.25)] bg-[rgb(var(--color-error)/0.1)] px-3 py-2 text-sm text-[rgb(var(--color-error))]"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {exportError}
        </div>
      )}

      {/* Barra rápida de búsqueda */}
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
          onChange={(e) => {
            setLevel(e.target.value as "" | LogLevelType)
            setPage(1)
          }}
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
          className={`focus-ring inline-flex h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-colors ${
            showAdvanced || advancedCount > 0
              ? "border-[rgb(var(--color-primary)/0.4)] bg-[rgb(var(--color-primary)/0.1)] text-[rgb(var(--color-primary))]"
              : "border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-fg-secondary))] hover:bg-[rgb(var(--color-surface-2))]"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filtros
          {advancedCount > 0 && (
            <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-full bg-[rgb(var(--color-primary))] px-1.5 text-[0.6875rem] font-semibold text-[rgb(var(--color-bg))]">
              {advancedCount}
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
            {errorCode && <p className="mono text-xs text-[rgb(var(--color-muted))]">{errorCode}</p>}
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
              <Pagination meta={meta} onPageChange={setPage} disabled={isFetching} />
            )}
          </>
        )}
      </div>

      <LogDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  )
}
