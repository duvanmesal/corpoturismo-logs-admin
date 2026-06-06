import { useState } from "react"
import { Download, FileJson, FileText, Loader2 } from "lucide-react"

interface ExportMenuProps {
  canExport: boolean
  isExporting: boolean
  onExport: (format: "csv" | "json") => void
}

export function ExportMenu({ canExport, isExporting, onExport }: ExportMenuProps) {
  const [open, setOpen] = useState(false)

  const choose = (format: "csv" | "json") => {
    setOpen(false)
    onExport(format)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => canExport && setOpen((v) => !v)}
        disabled={!canExport || isExporting}
        title={
          canExport
            ? "Exportar resultados"
            : "Define un rango de fechas (Desde / Hasta) en Filtros para exportar"
        }
        aria-haspopup="menu"
        aria-expanded={open}
        className="focus-ring inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface))] px-3 py-2 text-sm font-medium text-[rgb(var(--color-fg-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-2))] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )}
        Exportar
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1.5 w-40 overflow-hidden rounded-lg border border-[rgb(var(--color-border)/0.14)] bg-[rgb(var(--color-bg-elevated))] py-1 shadow-[var(--shadow-lg)]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => choose("csv")}
              className="focus-ring flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[rgb(var(--color-fg-secondary))] hover:bg-[rgb(var(--color-surface-2))]"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              CSV
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => choose("json")}
              className="focus-ring flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[rgb(var(--color-fg-secondary))] hover:bg-[rgb(var(--color-surface-2))]"
            >
              <FileJson className="h-4 w-4" aria-hidden="true" />
              JSON
            </button>
          </div>
        </>
      )}
    </div>
  )
}
