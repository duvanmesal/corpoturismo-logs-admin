import { Inbox } from "lucide-react"
import type { LogItem } from "@/core/models/logs"
import { LogLevelBadge } from "./LogLevelBadge"
import { formatDateTime, formatDuration } from "@/core/utils/format"

interface LogsTableProps {
  logs: LogItem[]
  isLoading: boolean
  pageSize: number
  onRowClick: (log: LogItem) => void
}

interface Column {
  label: string
  num?: boolean
  grow?: boolean
}

const COLUMNS: Column[] = [
  { label: "Fecha" },
  { label: "Nivel" },
  { label: "Servicio" },
  { label: "Evento", grow: true },
  { label: "Usuario" },
  { label: "Método" },
  { label: "Status", num: true },
  { label: "Duración", num: true },
  { label: "Request ID" },
]

function statusColorToken(status?: number): string {
  if (status == null) return "--color-muted"
  if (status >= 500) return "--color-error"
  if (status >= 400) return "--color-warn"
  if (status >= 200 && status < 300) return "--color-success"
  return "--color-fg-secondary"
}

function rowKeyProps(log: LogItem, onRowClick: (log: LogItem) => void) {
  return {
    onClick: () => onRowClick(log),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onRowClick(log)
      }
    },
    tabIndex: 0,
    role: "button" as const,
    "aria-label": `Ver detalle del log ${log.event}`,
  }
}

/* ── Mobile card ── */
function MobileLogCard({ log, onRowClick }: { log: LogItem; onRowClick: (log: LogItem) => void }) {
  const token = statusColorToken(log.http?.status)
  const user = log.actor?.email ?? log.actor?.userId ?? "—"
  return (
    <div
      {...rowKeyProps(log, onRowClick)}
      className="cursor-pointer px-4 py-3.5 transition-colors hover:bg-[rgb(var(--color-primary)/0.04)] focus-ring"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <LogLevelBadge level={log.level} />
          <span className="truncate text-xs text-[rgb(var(--color-fg-secondary))]">
            {log.service ?? "—"}
          </span>
        </div>
        <span className="tabular shrink-0 text-xs text-[rgb(var(--color-muted))]">
          {formatDateTime(log.ts)}
        </span>
      </div>

      <p
        className="mono mt-1.5 truncate text-sm font-medium text-[rgb(var(--color-fg))]"
        title={log.event}
      >
        {log.event}
      </p>
      {log.message && (
        <p className="mt-0.5 truncate text-xs text-[rgb(var(--color-muted))]" title={log.message}>
          {log.message}
        </p>
      )}

      <div className="mt-2 flex items-center gap-3 text-xs">
        {log.http?.method && (
          <span className="mono text-[rgb(var(--color-fg-secondary))]">{log.http.method}</span>
        )}
        {log.http?.status != null && (
          <span className="tabular font-medium" style={{ color: `rgb(var(${token}))` }}>
            {log.http.status}
          </span>
        )}
        {log.http?.durationMs != null && (
          <span className="tabular text-[rgb(var(--color-muted))]">
            {formatDuration(log.http.durationMs)}
          </span>
        )}
        <span className="ml-auto min-w-0 truncate text-[rgb(var(--color-muted))]" title={user}>
          {user}
        </span>
      </div>
    </div>
  )
}

function MobileSkeletonCard() {
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="skeleton h-5 w-12 rounded-full" />
          <div className="skeleton h-3.5 w-16" />
        </div>
        <div className="skeleton h-3.5 w-24" />
      </div>
      <div className="skeleton mt-2 h-4 w-3/4" />
      <div className="skeleton mt-1.5 h-3 w-1/2" />
      <div className="mt-2 flex gap-3">
        <div className="skeleton h-3 w-10" />
        <div className="skeleton h-3 w-8" />
        <div className="skeleton ml-auto h-3 w-28" />
      </div>
    </div>
  )
}

export function LogsTable({ logs, isLoading, pageSize, onRowClick }: LogsTableProps) {
  if (!isLoading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgb(var(--color-surface-2))]">
          <Inbox className="h-6 w-6 text-[rgb(var(--color-muted))]" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-[rgb(var(--color-fg-secondary))]">
          No hay registros para estos filtros
        </p>
        <p className="text-xs text-[rgb(var(--color-muted))]">
          Ajusta el rango, el nivel o el texto de búsqueda.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* ── Mobile/tablet: cards (< lg) ── */}
      <div className="divide-y divide-[rgb(var(--color-border)/0.07)] lg:hidden">
        {isLoading
          ? Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => (
              <MobileSkeletonCard key={`sk-${i}`} />
            ))
          : logs.map((log) => (
              <MobileLogCard
                key={log._id ?? log.id ?? `${log.ts}-${log.event}`}
                log={log}
                onRowClick={onRowClick}
              />
            ))}
      </div>

      {/* ── Desktop: full table (lg+) ── */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="logs-table min-w-[64rem]">
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.label} className={c.num ? "num" : undefined}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    {COLUMNS.map((c) => (
                      <td key={c.label} className={c.num ? "num" : undefined}>
                        <div className="skeleton h-3.5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : logs.map((log) => {
                  const token = statusColorToken(log.http?.status)
                  const user = log.actor?.email ?? log.actor?.userId ?? "—"
                  return (
                    <tr
                      key={log._id ?? log.id ?? `${log.ts}-${log.event}`}
                      {...rowKeyProps(log, onRowClick)}
                      className="cursor-pointer focus-ring"
                    >
                      <td className="tabular whitespace-nowrap text-[rgb(var(--color-fg-secondary))]">
                        {formatDateTime(log.ts)}
                      </td>
                      <td>
                        <LogLevelBadge level={log.level} />
                      </td>
                      <td
                        className="whitespace-nowrap text-[rgb(var(--color-fg-secondary))]"
                        title={log.service ?? undefined}
                      >
                        {log.service ?? "—"}
                      </td>
                      <td className="w-full">
                        <div className="min-w-[12rem] max-w-[40rem]">
                          <span
                            className="mono block truncate text-[rgb(var(--color-fg))]"
                            title={log.event}
                          >
                            {log.event}
                          </span>
                          {log.message && (
                            <p
                              className="mt-0.5 truncate text-xs text-[rgb(var(--color-muted))]"
                              title={log.message}
                            >
                              {log.message}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className="block max-w-[14rem] truncate text-[rgb(var(--color-fg-secondary))]"
                          title={user}
                        >
                          {user}
                        </span>
                      </td>
                      <td className="mono whitespace-nowrap text-[rgb(var(--color-fg-secondary))]">
                        {log.http?.method ?? "—"}
                      </td>
                      <td className="num tabular whitespace-nowrap">
                        {log.http?.status != null ? (
                          <span
                            className="font-medium"
                            style={{ color: `rgb(var(${token}))` }}
                          >
                            {log.http.status}
                          </span>
                        ) : (
                          <span className="text-[rgb(var(--color-muted))]">—</span>
                        )}
                      </td>
                      <td className="num tabular whitespace-nowrap text-[rgb(var(--color-fg-secondary))]">
                        {formatDuration(log.http?.durationMs)}
                      </td>
                      <td className="mono whitespace-nowrap text-[rgb(var(--color-muted))]">
                        {log.requestId ? (
                          <span title={log.requestId} className="cursor-help">
                            {log.requestId.slice(0, 8)}…
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>
    </>
  )
}
