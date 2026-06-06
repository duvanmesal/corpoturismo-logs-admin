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
import { useTimeline } from "./hooks/use-timeline"
import { extractApiError } from "@/core/utils/api-error"
import { AlertSettings } from "@/features/alerts/AlertSettings"
import { PageHeader } from "@/shared/components/PageHeader"
import type { LogsTimelineBucket } from "@/core/models/logs"

const RANGES = [
  { value: "24h", label: "Últimas 24 h", hours: 24, bucket: "hour" as const },
  { value: "7d", label: "Últimos 7 días", hours: 24 * 7, bucket: "day" as const },
  { value: "30d", label: "Últimos 30 días", hours: 24 * 30, bucket: "day" as const },
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
  const rangeConfig = RANGES.find((r) => r.value === range)!
  const from = useMemo(() => fromForRange(rangeConfig.hours), [rangeConfig.hours])
  const to = useMemo(() => new Date().toISOString(), [range])

  const statsQuery = useStats({ from, topEventsLimit: 8 })
  const totalQuery = useTotal({ from })
  const timelineQuery = useTimeline({ from, to, bucket: rangeConfig.bucket, tz: "America/Bogota" })

  const stats = statsQuery.data?.data
  const total = totalQuery.data ?? 0
  const timelineBuckets = timelineQuery.data?.data ?? []
  const errors = levelCount(stats?.byLevel, "error")
  const warns = levelCount(stats?.byLevel, "warn")
  const infos = levelCount(stats?.byLevel, "info")

  const isLoading = statsQuery.isLoading || totalQuery.isLoading
  const isError = statsQuery.isError || totalQuery.isError
  const isFetching = statsQuery.isFetching || totalQuery.isFetching || timelineQuery.isFetching

  const refetch = () => {
    statsQuery.refetch()
    totalQuery.refetch()
    timelineQuery.refetch()
  }

  const maxDay = Math.max(1, ...(stats?.errorsByDay ?? []).map((d) => d.count))
  const maxEvent = Math.max(1, ...(stats?.topEvents ?? []).map((e) => e.count))

  return (
    <div className="space-y-6">
      <PageHeader title="Resumen de actividad" subtitle="Métricas agregadas de los logs del sistema.">
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
      </PageHeader>

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
            <StatCard label="Total registros" value={total} icon={Activity} token="--color-primary" loading={isLoading} />
            <StatCard label="Errores" value={errors} icon={AlertOctagon} token="--color-error" loading={isLoading} />
            <StatCard label="Advertencias" value={warns} icon={AlertTriangle} token="--color-warn" loading={isLoading} />
            <StatCard label="Info" value={infos} icon={Info} token="--color-info" loading={isLoading} />
          </div>

          {/* Gráficas — layout asimétrico 3:2 */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
            {/* Top eventos */}
            <section className="panel p-5">
              <header className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="section-title">Eventos más frecuentes</h2>
                  <p className="mt-0.5 text-xs text-[rgb(var(--color-muted))]">
                    Top {stats?.topEvents.length ?? 0} eventos en el rango seleccionado
                  </p>
                </div>
                <Link
                  to="/logs"
                  className="focus-ring inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[rgb(var(--color-primary))] transition-colors hover:bg-[rgb(var(--color-primary)/0.08)]"
                >
                  Ver logs
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </header>

              {isLoading ? (
                <SkeletonRows />
              ) : stats && stats.topEvents.length > 0 ? (
                <ul className="space-y-3">
                  {stats.topEvents.map((e, i) => {
                    const pct = Math.round((e.count / maxEvent) * 100)
                    return (
                      <li key={e.event} className="flex items-center gap-3">
                        <span className="rank-badge">{String(i + 1).padStart(2, "0")}</span>
                        <span
                          className="mono w-28 shrink-0 truncate text-xs text-[rgb(var(--color-fg-secondary))] sm:w-40"
                          title={e.event}
                        >
                          {e.event}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgb(var(--color-surface-2))]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: `rgb(var(--color-primary))`,
                            }}
                          />
                        </div>
                        <span className="tabular w-10 shrink-0 text-right text-xs text-[rgb(var(--color-muted))]">
                          {e.count.toLocaleString("es-CO")}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <EmptyHint text="Sin eventos en el rango seleccionado." />
              )}
            </section>

            {/* Errores por día */}
            <section className="panel p-5">
              <header className="mb-5">
                <h2 className="section-title">Errores por día</h2>
                <p className="mt-0.5 text-xs text-[rgb(var(--color-muted))]">
                  Distribución temporal de errores
                </p>
              </header>

              {isLoading ? (
                <SkeletonRows count={4} />
              ) : stats && stats.errorsByDay.length > 0 ? (
                <ErrorsByDayChart data={stats.errorsByDay} max={maxDay} />
              ) : (
                <EmptyHint text="Sin errores en el rango seleccionado." />
              )}
            </section>
          </div>

          {/* Timeline de actividad */}
          <section className="panel p-5">
            <header className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="section-title">Actividad en el tiempo</h2>
                <p className="mt-0.5 text-xs text-[rgb(var(--color-muted))]">
                  Volumen de logs por {rangeConfig.bucket === "hour" ? "hora" : "día"} · desglosado por nivel
                </p>
              </div>
            </header>
            {timelineQuery.isLoading ? (
              <SkeletonRows count={3} />
            ) : timelineBuckets.length > 0 ? (
              <TimelineChart data={timelineBuckets} />
            ) : (
              <EmptyHint text="Sin actividad en el rango seleccionado." />
            )}
          </section>

          <AlertSettings />
        </>
      )}
    </div>
  )
}

/* ── Sub-componentes ─────────────────────────────────────── */

function StatCard({
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
    <div className="stat-card">
      <div
        className="stat-card__stripe"
        style={{ background: `rgb(var(${token}))` }}
      />
      <div className="flex items-start justify-between gap-2 pt-0.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9"
          style={{
            color: `rgb(var(${token}))`,
            backgroundColor: `rgba(var(${token}), 0.1)`,
          }}
        >
          <Icon className="h-4 w-4 sm:h-[1.05rem] sm:w-[1.05rem]" aria-hidden="true" />
        </span>
        {loading ? (
          <div className="skeleton h-7 w-16 self-end sm:h-8 sm:w-20" />
        ) : (
          <p className="tabular text-2xl font-bold leading-none tracking-tight text-[rgb(var(--color-fg))] sm:text-[1.875rem]">
            {value.toLocaleString("es-CO")}
          </p>
        )}
      </div>
      <p className="mt-2.5 text-xs font-medium text-[rgb(var(--color-muted))]">{label}</p>
    </div>
  )
}

function ErrorsByDayChart({
  data,
  max,
}: {
  data: Array<{ day: string; count: number }>
  max: number
}) {
  return (
    <div className="relative">
      {/* Grid lines horizontales */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between"
        style={{ height: "calc(100% - 1.5rem)" }}
        aria-hidden="true"
      >
        {[100, 75, 50, 25].map((pct) => (
          <div key={pct} className="flex items-center gap-1.5">
            <span className="w-4 shrink-0 text-right text-[0.5rem] text-[rgb(var(--color-muted))]">
              {pct}%
            </span>
            <div className="flex-1 border-t border-dashed border-[rgb(var(--color-border)/0.08)]" />
          </div>
        ))}
      </div>

      {/* Barras */}
      <div className="flex h-36 items-end gap-1 pl-6">
        {data.map((d) => {
          const heightPct = Math.max(3, (d.count / max) * 100)
          const hasData = d.count > 0
          return (
            <div
              key={d.day}
              className="group flex flex-1 flex-col items-center justify-end gap-1"
              title={`${d.day}: ${d.count} error${d.count !== 1 ? "es" : ""}`}
            >
              {hasData && (
                <span className="tabular text-[0.5rem] text-[rgb(var(--color-muted))]">{d.count}</span>
              )}
              <div
                className="w-full rounded-t-sm transition-all duration-200 group-hover:brightness-110"
                style={{
                  height: `${heightPct}%`,
                  background: hasData
                    ? `linear-gradient(to top, rgb(var(--color-error)/0.8), rgb(var(--color-error)/0.5))`
                    : `rgb(var(--color-surface-2))`,
                }}
              />
              <span className="text-[0.5rem] text-[rgb(var(--color-muted))]">
                {d.day.slice(5)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton h-5 w-5 rounded" />
          <div className="skeleton h-3.5 w-40" />
          <div className="skeleton h-1.5 flex-1 rounded-full" />
          <div className="skeleton h-3 w-8" />
        </div>
      ))}
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <p className="py-8 text-center text-xs text-[rgb(var(--color-muted))]">{text}</p>
}

const LEVEL_COLORS: Record<string, string> = {
  error: "var(--color-error)",
  warn: "var(--color-warn)",
  info: "var(--color-info)",
  debug: "var(--color-muted)",
}

function TimelineChart({ data }: { data: LogsTimelineBucket[] }) {
  const CHART_H = 120
  const LABEL_H = 18
  const maxTotal = Math.max(1, ...data.map((b) => b.total))
  const barW = Math.max(3, Math.min(24, Math.floor(600 / data.length) - 2))

  const labelStep = data.length <= 12 ? 1 : data.length <= 24 ? 2 : Math.ceil(data.length / 12)

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${data.length * (barW + 2)} ${CHART_H + LABEL_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
        aria-label="Gráfico de actividad en el tiempo"
        role="img"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((pct) => {
          const y = CHART_H - CHART_H * pct
          return (
            <line
              key={pct}
              x1={0}
              x2={data.length * (barW + 2)}
              y1={y}
              y2={y}
              stroke={`rgba(var(--color-border), 0.08)`}
              strokeDasharray="3 3"
            />
          )
        })}

        {data.map((b, i) => {
          const x = i * (barW + 2) + 1
          const levels = ["debug", "info", "warn", "error"] as const
          let stackY = CHART_H

          return (
            <g key={b.ts}>
              {levels.map((lv) => {
                const count = b[lv]
                if (count === 0) return null
                const h = Math.max(1, (count / maxTotal) * CHART_H)
                stackY -= h
                return (
                  <rect
                    key={lv}
                    x={x}
                    y={stackY}
                    width={barW}
                    height={h}
                    fill={`rgb(${LEVEL_COLORS[lv]})`}
                    opacity={0.85}
                    rx={1}
                  >
                    <title>{`${b.ts} · ${lv}: ${count}`}</title>
                  </rect>
                )
              })}

              {i % labelStep === 0 && (
                <text
                  x={x + barW / 2}
                  y={CHART_H + LABEL_H - 2}
                  textAnchor="middle"
                  fontSize={7}
                  fill={`rgb(var(--color-muted))`}
                >
                  {b.ts.length > 10 ? b.ts.slice(11, 16) : b.ts.slice(5)}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Leyenda */}
      <div className="mt-2 flex flex-wrap gap-3">
        {(["error", "warn", "info", "debug"] as const).map((lv) => (
          <span key={lv} className="flex items-center gap-1.5 text-[0.625rem] text-[rgb(var(--color-muted))]">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: `rgb(${LEVEL_COLORS[lv]})` }}
            />
            {lv}
          </span>
        ))}
      </div>
    </div>
  )
}
