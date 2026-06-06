import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, RefreshCw, AlertTriangle, ServerCrash, Clock, Layers } from "lucide-react"
import { useLog } from "./hooks/use-log"
import { useLogs } from "./hooks/use-logs"
import { LogDetailBody } from "./components/LogDetailBody"
import { LogLevelBadge } from "./components/LogLevelBadge"
import { formatDateTime } from "@/core/utils/format"
import { extractApiError, extractApiErrorCode } from "@/core/utils/api-error"
import type { LogItem } from "@/core/models/logs"

const LEVEL_COLOR: Record<string, string> = {
  error: "var(--color-error)",
  warn: "var(--color-warn)",
  info: "var(--color-info)",
  debug: "var(--color-muted)",
}

export function LogDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch, isFetching } = useLog(id)
  const log = data?.data ?? null

  const errorCode = isError ? extractApiErrorCode(error) : undefined
  const isServiceIssue =
    errorCode === "SERVICE_UNAVAILABLE" ||
    errorCode === "BAD_GATEWAY" ||
    errorCode === "GATEWAY_TIMEOUT" ||
    errorCode === "LOGS_SERVICE_AUTH_ERROR"

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/logs"))}
          className="focus-ring inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface))] px-3 py-2 text-sm font-medium text-[rgb(var(--color-fg-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-2))]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </button>
        {!isLoading && (
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="focus-ring inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface))] px-3 py-2 text-sm font-medium text-[rgb(var(--color-fg-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-2))] disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
            Refrescar
          </button>
        )}
      </div>

      {/* Main detail panel */}
      <div className="panel overflow-hidden">
        {isLoading ? (
          <div className="space-y-4 p-5">
            <div className="skeleton h-5 w-48" />
            <div className="skeleton h-3.5 w-32" />
            <div className="skeleton h-24 w-full" />
          </div>
        ) : isError ? (
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
        ) : log ? (
          <>
            <header className="border-b border-[rgb(var(--color-border)/0.1)] px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <LogLevelBadge level={log.level} />
                <span className="mono break-all text-sm text-[rgb(var(--color-fg))]">{log.event}</span>
              </div>
              <p className="mt-1 text-xs text-[rgb(var(--color-muted))]">{formatDateTime(log.ts)}</p>
            </header>
            <LogDetailBody log={log} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-20 text-center">
            <p className="text-sm font-medium text-[rgb(var(--color-fg-secondary))]">
              No se encontró el registro
            </p>
            <Link
              to="/logs"
              className="focus-ring text-sm font-medium text-[rgb(var(--color-primary))] hover:underline"
            >
              Volver a los logs
            </Link>
          </div>
        )}
      </div>

      {/* Request timeline — only if log has requestId */}
      {log?.requestId && (
        <RequestTimeline requestId={log.requestId} currentId={id ?? ""} />
      )}

      {/* Related logs — same actor or same target entity */}
      {log && (log.actor?.userId || log.target?.entity) && (
        <RelatedLogs log={log} currentId={id ?? ""} />
      )}
    </div>
  )
}

/* ── Request timeline ──────────────────────────────────────────────────── */

function RequestTimeline({ requestId, currentId }: { requestId: string; currentId: string }) {
  const { data, isLoading } = useLogs({
    requestId,
    limit: 50,
    order: "asc",
    page: 1,
  })

  const items = data?.data ?? []
  if (!isLoading && items.length <= 1) return null

  return (
    <section className="panel p-5">
      <header className="mb-4 flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--color-primary)/0.1)]">
          <Clock className="h-3.5 w-3.5 text-[rgb(var(--color-primary))]" aria-hidden="true" />
        </div>
        <div>
          <h2 className="section-title">Timeline de request</h2>
          <p className="mt-0.5 text-[0.6875rem] text-[rgb(var(--color-muted))] font-mono">{requestId}</p>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton h-4 w-4 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3.5 w-48" />
                <div className="skeleton h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ol className="relative space-y-0">
          {items.map((item, i) => {
            const isCurrent = item._id === currentId || item.id === currentId
            const color = LEVEL_COLOR[item.level] ?? LEVEL_COLOR.debug
            const isLast = i === items.length - 1

            return (
              <li key={item._id ?? item.id ?? i} className="relative flex gap-3 pb-4 last:pb-0">
                {/* Connector line */}
                {!isLast && (
                  <div
                    className="absolute left-[7px] top-4 w-px"
                    style={{ bottom: 0, background: `rgba(var(--color-border), 0.12)` }}
                  />
                )}

                {/* Dot */}
                <div
                  className="relative mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full"
                  style={{
                    background: isCurrent ? `rgb(${color})` : `rgba(${color}, 0.25)`,
                    boxShadow: isCurrent ? `0 0 0 2px rgb(${color})` : `0 0 0 2px rgba(${color},0.3)`,
                  }}
                />

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <Link
                      to={`/logs/${item._id ?? item.id}`}
                      className={[
                        "mono truncate text-xs font-medium transition-colors hover:underline",
                        isCurrent
                          ? "text-[rgb(var(--color-fg))]"
                          : "text-[rgb(var(--color-fg-secondary))] hover:text-[rgb(var(--color-fg))]",
                      ].join(" ")}
                    >
                      {item.event}
                    </Link>
                    {item.http?.status && (
                      <span className="shrink-0 text-[0.625rem] text-[rgb(var(--color-muted))]">
                        {item.http.method} {item.http.status}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[0.625rem] text-[rgb(var(--color-muted))]">
                    {formatDateTime(item.ts)}
                    {item.http?.durationMs != null && ` · ${item.http.durationMs}ms`}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

/* ── Related logs — by same actor userId ──────────────────────────────── */

function RelatedLogs({ log, currentId }: { log: LogItem; currentId: string }) {
  const userId = log.actor?.userId
  if (!userId) return null

  const { data, isLoading } = useLogs(
    { userId, limit: 6, order: "desc", page: 1 },
    { enabled: true },
  )

  const items = (data?.data ?? []).filter((item) => (item._id ?? item.id) !== currentId)

  return (
    <section className="panel p-5">
      <header className="mb-4 flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--color-info)/0.1)]">
          <Layers className="h-3.5 w-3.5 text-[rgb(var(--color-info))]" aria-hidden="true" />
        </div>
        <div>
          <h2 className="section-title">Registros del mismo usuario</h2>
          <p className="mt-0.5 mono text-[0.625rem] text-[rgb(var(--color-muted))]">{userId}</p>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-9 w-full rounded-lg" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="py-4 text-center text-xs text-[rgb(var(--color-muted))]">
          Sin actividad reciente de este usuario.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item._id ?? item.id}>
              <Link
                to={`/logs/${item._id ?? item.id}`}
                className="focus-ring flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[rgb(var(--color-surface-2))]"
              >
                <LogLevelBadge level={item.level} />
                <span className="mono min-w-0 flex-1 truncate text-xs text-[rgb(var(--color-fg-secondary))]">
                  {item.event}
                </span>
                <span className="shrink-0 text-[0.625rem] text-[rgb(var(--color-muted))]">
                  {formatDateTime(item.ts)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
