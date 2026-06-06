import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, RefreshCw, AlertTriangle, ServerCrash } from "lucide-react"
import { useLog } from "./hooks/use-log"
import { LogDetailBody } from "./components/LogDetailBody"
import { LogLevelBadge } from "./components/LogLevelBadge"
import { formatDateTime } from "@/core/utils/format"
import { extractApiError, extractApiErrorCode } from "@/core/utils/api-error"

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

      <div className="panel overflow-hidden">
        {isLoading ? (
          <div className="space-y-4 p-5">
            <div className="skeleton h-5 w-48" />
            <div className="skeleton h-3.5 w-32" />
            <div className="skeleton h-24 w-full" />
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
    </div>
  )
}
