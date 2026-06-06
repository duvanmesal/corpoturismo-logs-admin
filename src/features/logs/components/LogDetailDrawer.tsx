import { useEffect } from "react"
import { Link } from "react-router-dom"
import { X, ExternalLink } from "lucide-react"
import type { LogItem } from "@/core/models/logs"
import { LogLevelBadge } from "./LogLevelBadge"
import { LogDetailBody } from "./LogDetailBody"
import { formatDateTime } from "@/core/utils/format"

interface LogDetailDrawerProps {
  log: LogItem | null
  onClose: () => void
}

export function LogDetailDrawer({ log, onClose }: LogDetailDrawerProps) {
  useEffect(() => {
    if (!log) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [log, onClose])

  if (!log) return null

  const logId = log._id ?? log.id

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end md:flex-row md:justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Detalle del log"
    >
      <div className="absolute inset-0 bg-black/55" onClick={onClose} aria-hidden="true" />

      {/* Mobile: bottom sheet — Desktop: side panel from right */}
      <aside className="drawer-sheet relative flex w-full flex-col bg-[rgb(var(--color-bg-elevated))] shadow-[var(--shadow-lg)] max-h-[92dvh] rounded-t-2xl md:h-full md:max-h-none md:max-w-lg md:rounded-none">

        {/* Drag handle — only on mobile */}
        <div className="flex shrink-0 justify-center pt-3 pb-1 md:hidden" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-[rgb(var(--color-border)/0.3)]" />
        </div>

        {/* Header */}
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[rgb(var(--color-border)/0.1)] px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <LogLevelBadge level={log.level} />
              <span className="mono truncate text-sm text-[rgb(var(--color-fg))]">{log.event}</span>
            </div>
            <p className="mt-1 text-xs text-[rgb(var(--color-muted))]">{formatDateTime(log.ts)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {logId && (
              <Link
                to={`/logs/${logId}`}
                className="focus-ring inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[rgb(var(--color-primary))] transition-colors hover:bg-[rgb(var(--color-primary)/0.1)]"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Vista completa</span>
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="focus-ring rounded-md p-1.5 text-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-surface-2))] hover:text-[rgb(var(--color-fg))]"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <LogDetailBody log={log} />
        </div>
      </aside>
    </div>
  )
}
