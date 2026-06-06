import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  RefreshCw,
  Activity,
  AlertOctagon,
  AlertTriangle,
  Info,
  ArrowRight,
  ServerCrash,
} from "lucide-react"
import { useStats, useTotal } from "./hooks/use-stats"
import { extractApiError } from "@/core/utils/api-error"
import { AlertSettings } from "@/features/alerts/AlertSettings"

const RANGES = [
  { value: "24h", label: "Últimas 24 h", hours: 24 },
  { value: "7d", label: "Últimos 7 días", hours: 24 * 7 },
  { value: "30d", label: "Últimos 30 días", hours: 24 * 30 },
] as const
type RangeValue = (typeof RANGES)[number]["value"]

function fromForRange(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString()
}

function levelCount(byLevel: Array<{ level: string; count: number }> | undefined, level: string): number {
  return byLevel?.find((b) => b.level === level)?.count ?? 0
}

export function DashboardPage() {
  const [range, setRange] = useState<RangeValue>("7d")
  const hours = RANGES.find((r) => r.value === range)!.hours
  const from = useMemo(() => fromForRange(hours), [hours])

  const statsQuery = useStats({ from, topEventsLimit: 8 })
  const totalQuery = useTotal({ from })

  const stats = statsQuery.data?.data
  const total = totalQuery.data ?? 0
  const errors = levelCount(stats?.byLevel, "error")
  const warns = levelCount(stats?.byLevel, "warn")
  const infos = levelCount(stats?.byLevel, "info")

  const isLoading = statsQuery.isLoading || totalQuery.isLoading
  const isError = statsQuery.isError || totalQuery.isError
  const isFetching = statsQuery.isFetching || totalQuery.isFetching

  const refetch = () => {
    statsQuery.refetch()
    totalQuery.refetch()
  }

  const maxDay = Math.max(1, ...(stats?.errorsByDay ?? []).map((d) => d.count))
  const maxEvent = Math.max(1, ...(stats?.topEvents ?? []).map((e) => e.count))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[rgb(var(--color-fg))]">
            Resumen de actividad
          </h1>
          <p className="mt-0.5 text-sm text-[rgb(var(--color-muted))]">
            Métricas agregadas de los logs del sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as RangeValue)}
            className="focus-ring rounded-lg border border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface))] px-3 py-2 text-sm text-[rgb(var(--color-fg))]"
            aria-label="Rango de tiempo"
          >
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={refetch}
            disabled={isFetching}
            className="focus-ring inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface))] px-3 py-2 text-sm font-medium text-[rgb(var(--color-fg-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-2))] disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
            Refrescar
          </button>
        </div>
      </div>

      {isError ? (
        <div className="panel flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgb(var(--color-error)/0.12)] ring-1 ring-[rgb(var(--color-error)/0.22)]">
            <ServerCrash className="h-6 w-6 text-[rgb(var(--color-error))]" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-[rgb(var(--color-fg-secondary))]">
            {extractApiError(statsQuery.error ?? totalQuery.error)}
          </p>
          <button
            type="button"
            onClick={refetch}
            className="focus-ring mt-1 inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border)/0.16)] px-3 py-2 text-sm font-medium text-[rgb(var(--color-fg-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-2))]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Total registros" value={total} icon={Activity} token="--color-primary" loading={isLoading} />
            <StatTile label="Errores" value={errors} icon={AlertOctagon} token="--color-error" loading={isLoading} />
            <StatTile label="Advertencias" value={warns} icon={AlertTriangle} token="--color-warn" loading={isLoading} />
            <StatTile label="Info" value={infos} icon={Info} token="--color-info" loading={isLoading} />
          </div>

          {/* Top eventos + errores por día (layout asimétrico) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            <section className="panel p-5">
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[rgb(var(--color-fg))]">Eventos más frecuentes</h2>
                <Link
                  to="/logs"
                  className="focus-ring inline-flex items-center gap-1 text-xs font-medium text-[rgb(var(--color-primary))] hover:underline"
                >
                  Ver logs
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </header>

              {isLoading ? (
                <SkeletonRows />
              ) : stats && stats.topEvents.length > 0 ? (
                <ul className="space-y-2.5">
                  {stats.topEvents.map((e) => (
                    <li key={e.event} className="flex items-center gap-3">
                      <span className="mono w-44 shrink-0 truncate text-xs text-[rgb(var(--color-fg-secondary))]">
                        {e.event}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[rgb(var(--color-surface-2))]">
                        <div
                          className="h-full rounded-full bg-[rgb(var(--color-primary))]"
                          style={{ width: `${(e.count / maxEvent) * 100}%` }}
                        />
                      </div>
                      <span className="tabular w-10 shrink-0 text-right text-xs text-[rgb(var(--color-muted))]">
                        {e.count}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyHint text="Sin eventos en el rango seleccionado." />
              )}
            </section>

            <section className="panel p-5">
              <h2 className="mb-4 text-sm font-semibold text-[rgb(var(--color-fg))]">Errores por día</h2>

              {isLoading ? (
                <SkeletonRows />
              ) : stats && stats.errorsByDay.length > 0 ? (
                <div className="flex h-40 items-end gap-1.5">
                  {stats.errorsByDay.map((d) => (
                    <div key={d.day} className="group flex flex-1 flex-col items-center justify-end gap-1.5" title={`${d.day}: ${d.count}`}>
                      <span className="tabular text-[0.625rem] text-[rgb(var(--color-muted))]">{d.count}</span>
                      <div
                        className="w-full rounded-t bg-[rgb(var(--color-error)/0.7)] transition-colors group-hover:bg-[rgb(var(--color-error))]"
                        style={{ height: `${Math.max(4, (d.count / maxDay) * 100)}%` }}
                      />
                      <span className="text-[0.5625rem] text-[rgb(var(--color-muted))]">
                        {d.day.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyHint text="Sin errores en el rango seleccionado." />
              )}
            </section>
          </div>

          <AlertSettings />
        </>
      )}
    </div>
  )
}

function StatTile({
  label,
  value,
  icon: Icon,
  token,
  loading,
}: {
  label: string
  value: number
  icon: typeof Activity
  token: string
  loading: boolean
}) {
  return (
    <div className="panel panel-hover p-4">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            color: `rgb(var(${token}))`,
            backgroundColor: `rgb(var(${token}) / 0.12)`,
          }}
        >
          <Icon className="h-[1.05rem] w-[1.05rem]" aria-hidden="true" />
        </span>
        <span className="text-xs font-medium text-[rgb(var(--color-muted))]">{label}</span>
      </div>
      {loading ? (
        <div className="skeleton mt-3 h-8 w-20" />
      ) : (
        <p className="tabular mt-3 text-[1.75rem] font-bold leading-none text-[rgb(var(--color-fg))]">
          {value.toLocaleString("es-CO")}
        </p>
      )}
    </div>
  )
}

function SkeletonRows() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton h-4 w-full" />
      ))}
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <p className="py-8 text-center text-xs text-[rgb(var(--color-muted))]">{text}</p>
}
