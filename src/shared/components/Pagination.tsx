import { ChevronLeft, ChevronRight } from "lucide-react"
import type { MetaPage } from "@/core/models/api"

interface PaginationProps {
  meta: MetaPage
  onPageChange: (page: number) => void
  disabled?: boolean
}

export function Pagination({ meta, onPageChange, disabled }: PaginationProps) {
  const { page, totalPages, total, pageSize } = meta
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between gap-4 border-t border-[rgb(var(--color-border)/0.08)] px-4 py-3">
      <p className="text-xs text-[rgb(var(--color-muted))]">
        <span className="tabular text-[rgb(var(--color-fg-secondary))]">{from}</span>–
        <span className="tabular text-[rgb(var(--color-fg-secondary))]">{to}</span> de{" "}
        <span className="tabular text-[rgb(var(--color-fg-secondary))]">{total}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          className="focus-ring inline-flex items-center gap-1 rounded-md border border-[rgb(var(--color-border)/0.16)] px-2 py-1.5 text-xs font-medium text-[rgb(var(--color-fg-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-2))] disabled:cursor-not-allowed disabled:opacity-40 sm:px-2.5"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Anterior</span>
        </button>
        <span className="tabular text-xs text-[rgb(var(--color-muted))]">
          {page} / {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          className="focus-ring inline-flex items-center gap-1 rounded-md border border-[rgb(var(--color-border)/0.16)] px-2 py-1.5 text-xs font-medium text-[rgb(var(--color-fg-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-2))] disabled:cursor-not-allowed disabled:opacity-40 sm:px-2.5"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
