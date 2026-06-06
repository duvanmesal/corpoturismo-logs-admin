import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  RefreshCw,
  Activity,
  AlertOctagon,
  AlertTriangle,
  Info,
  ArrowRight,
  ServerCrash,
  FileSearch,
  type LucideIcon,
} from "lucide-react"
import { useStats, useTotal } from "./hooks/use-stats"
import { useTimeline } from "./hooks/use-timeline"
import { extractApiError } from "@/core/utils/api-error"
import { AlertSettings } from "@/features/alerts/AlertSettings"
import type { LogsTimelineBucket } from "@/core/models/logs"

const RANGES = [
  { value: "24h", label: "24 h",       hours: 24,      bucket: "hour" as const },
  { value: "7d",  label: "7 días",     hours: 24 * 7,  bucket: "day"  as const },
  { value: "30d", label: "30 días",    hours: 24 * 30, bucket: "day"  as const },
] as const
type RangeValue = (typeof RANGES)[number]["value"]

function fromForRange(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString()
}

function levelCount(byLevel: Array<{ level: string; count: number }> | undefined, level: string): number {
  return byLevel?.find((b) => b.level === level)?.count ?? 0
}

// ─── page ──────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const [range, setRange] = useState<RangeValue>("7d")
  const rangeConfig = RANGES.find((r) => r.value === range)!
  const from = useMemo(() => fromForRange(rangeConfig.hours), [rangeConfig.hours])
  const to   = useMemo(() => new Date().toISOString(), [range])

  const statsQuery    = useStats({ from, topEventsLimit: 8 })
  const totalQuery    = useTotal({ from })
  const timelineQuery = useTimeline({ from, to, bucket: rangeConfig.bucket, tz: "America/Bogota" })

  const stats          = statsQuery.data?.data
  const total          = totalQuery.data ?? 0
  const timelineBuckets = timelineQuery.data?.data ?? []
  const errors         = levelCount(stats?.byLevel, "error")
  const warns          = levelCount(stats?.byLevel, "warn")
  const infos          = levelCount(stats?.byLevel, "info")

  const isLoading  = statsQuery.isLoading || totalQuery.isLoading
  const isError    = statsQuery.isError   || totalQuery.isError
  const isFetching = statsQuery.isFetching || totalQuery.isFetching || timelineQuery.isFetching

  const refetch = () => {
    statsQuery.refetch()
    totalQuery.refetch()
    timelineQuery.refetch()
  }

  const maxDay   = Math.max(1, ...(stats?.errorsByDay ?? []).map((d) => d.count))
  const maxEvent = Math.max(1, ...(stats?.topEvents   ?? []).map((e) => e.count))

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3 animate-fade-in-up">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--color-muted))]">
            Panel de actividad
          </p>
          <h1 className="page-title mt-0.5" style={{ fontSize: "1.5rem", letterSpacing: "-0.03em" }}>Resumen de logs</h1>
          <p className="page-subtitle">Métricas agregadas del sistema en el rango seleccionado.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented range picker */}
          <div
            className="inline-flex rounded-xl p-1"
            style={{
              background: `rgb(var(--color-surface-2))`,
              border: `1px solid rgba(var(--color-border), 0.12)`,
            }}
            role="group"
            aria-label="Rango de tiempo"
          >
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className="focus-ring rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-[0.97]"
                style={
                  range === r.value
                    ? {
                        background: `rgb(var(--color-surface))`,
                        color: `rgb(var(--color-fg))`,
                        boxShadow: `var(--shadow-sm)`,
                      }
                    : {
                        color: `rgb(var(--color-muted))`,
                      }
                }
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={refetch}
            disabled={isFetching}
            className="focus-ring inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 active:scale-[0.97] active:-translate-y-[1px] disabled:opacity-50"
            style={{
              background: `rgb(var(--color-surface))`,
              border: `1px solid rgba(var(--color-border), 0.14)`,
              color: `rgb(var(--color-fg-secondary))`,
              boxShadow: `var(--shadow-sm)`,
            }}
            aria-label="Refrescar datos"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
            Refrescar
          </button>
        </div>
      </div>

      {isError ? (
        <ErrorState
          message={extractApiError(statsQuery.error ?? totalQuery.error)}
          onRetry={refetch}
        />
      ) : (
        <>
          {/* ── KPI row ─────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total registros"
              value={total}
              icon={Activity}
              token="--color-primary"
              loading={isLoading}
              delay={0}
            />
            <StatCard
              label="Errores"
              value={errors}
              icon={AlertOctagon}
              token="--color-error"
              loading={isLoading}
              delay={60}
              accent
            />
            <StatCard
              label="Advertencias"
              value={warns}
              icon={AlertTriangle}
              token="--color-warn"
              loading={isLoading}
              delay={120}
            />
            <StatCard
              label="Info"
              value={infos}
              icon={Info}
              token="--color-info"
              loading={isLoading}
              delay={180}
            />
          </div>

          {/* ── Charts row — 3:2 split ──────────────────────────────────────── */}
          <div
            className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr] animate-fade-in-up"
            style={{ animationDelay: "0.09s" }}
          >
            {/* Top events */}
            <section className="panel p-5">
              <header className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="section-title flex items-center gap-2">
                    <span
                      className="inline-block h-3.5 w-0.5 shrink-0 rounded-full"
                      style={{ background: `rgb(var(--color-primary))` }}
                      aria-hidden="true"
                    />
                    Eventos más frecuentes
                  </h2>
                  <p className="mt-0.5 text-xs text-[rgb(var(--color-muted))]">
                    Top {stats?.topEvents.length ?? 0} en el rango · ordenados por volumen
                  </p>
                </div>
                <Link
                  to="/logs"
                  className="focus-ring inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[rgba(var(--color-primary),0.08)]"
                  style={{ color: `rgb(var(--color-primary))` }}
                >
                  Ver logs
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </header>

              {isLoading ? (
                <SkeletonRows />
              ) : stats && stats.topEvents.length > 0 ? (
                <ul className="space-y-3.5">
                  {stats.topEvents.map((e, i) => {
                    const pct = Math.round((e.count / maxEvent) * 100)
                    const isTop3 = i < 3
                    return (
                      <li key={e.event} className="group flex items-center gap-3">
                        <span
                          className="rank-badge shrink-0"
                          style={
                            isTop3
                              ? {
                                  background: `rgba(var(--color-primary), ${0.18 - i * 0.04})`,
                                  color: `rgb(var(--color-primary))`,
                                }
                              : {}
                          }
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className="mono w-28 shrink-0 truncate text-xs sm:w-44"
                          style={{ color: `rgb(var(--color-fg-secondary))` }}
                          title={e.event}
                        >
                          {e.event}
                        </span>
                        <div
                          className="h-1.5 flex-1 overflow-hidden rounded-full"
                          style={{ background: `rgba(var(--color-border), 0.12)` }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: `rgb(var(--color-primary))`,
                              opacity: 0.55 + (pct / 100) * 0.45,
                            }}
                          />
                        </div>
                        <span
                          className="tabular mono w-10 shrink-0 text-right text-xs"
                          style={{ color: `rgb(var(--color-muted))` }}
                        >
                          {e.count.toLocaleString("es-CO")}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <EmptyHint icon={FileSearch} text="Sin eventos registrados en el rango seleccionado." />
              )}
            </section>

            {/* Errors by day */}
            <section className="panel p-5 flex flex-col">
              <header className="mb-5 shrink-0">
                <h2 className="section-title flex items-center gap-2">
                  <span
                    className="inline-block h-3.5 w-0.5 shrink-0 rounded-full"
                    style={{ background: `rgb(var(--color-error))` }}
                    aria-hidden="true"
                  />
                  Errores por día
                </h2>
                <p className="mt-0.5 text-xs text-[rgb(var(--color-muted))]">
                  Distribución temporal · pico máximo: {maxDay === 1 ? 0 : maxDay}
                </p>
              </header>

              {isLoading ? (
                <SkeletonBars />
              ) : stats && stats.errorsByDay.length > 0 ? (
                <ErrorsByDayChart data={stats.errorsByDay} max={maxDay} />
              ) : (
                <EmptyHint icon={AlertOctagon} text="Sin errores en el rango seleccionado." />
              )}
            </section>
          </div>

          {/* ── Timeline ────────────────────────────────────────────────────── */}
          <section
            className="panel p-5 animate-fade-in-up"
            style={{ animationDelay: "0.14s" }}
          >
            <header className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="section-title flex items-center gap-2">
                  <span
                    className="inline-block h-3.5 w-0.5 shrink-0 rounded-full"
                    style={{ background: `rgb(var(--color-primary))` }}
                    aria-hidden="true"
                  />
                  Actividad en el tiempo
                </h2>
                <p className="mt-0.5 text-xs text-[rgb(var(--color-muted))]">
                  Volumen de logs por {rangeConfig.bucket === "hour" ? "hora" : "día"} · desglosado por nivel
                </p>
              </div>
              {/* Legend — inline with header */}
              <div className="hidden items-center gap-3 sm:flex">
                {(["error", "warn", "info", "debug"] as const).map((lv) => (
                  <span
                    key={lv}
                    className="flex items-center gap-1.5 text-[0.625rem] font-medium uppercase tracking-wide"
                    style={{ color: `rgb(var(--color-muted))` }}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-sm"
                      style={{ background: `rgb(var(${LEVEL_VAR[lv]}))` }}
                    />
                    {lv}
                  </span>
                ))}
              </div>
            </header>

            {timelineQuery.isLoading ? (
              <SkeletonBars count={5} />
            ) : timelineBuckets.length > 0 ? (
              <TimelineChart data={timelineBuckets} />
            ) : (
              <EmptyHint icon={Activity} text="Sin actividad en el rango seleccionado." />
            )}
          </section>

          <div className="animate-fade-in-up" style={{ animationDelay: "0.18s" }}>
            <AlertSettings />
          </div>
        </>
      )}
    </div>
  )
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  token,
  loading,
  delay = 0,
  accent = false,
}: {
  label: string
  value: number
  icon: LucideIcon
  token: string
  loading: boolean
  delay?: number
  accent?: boolean
}) {
  return (
    <div
      className="stat-card panel-hover animate-fade-in-up"
      style={{
        animationDelay: `${delay}ms`,
        ...(accent ? { background: `rgba(var(${token}), 0.04)` } : {}),
      }}
    >
      <div className="stat-card__stripe" style={{ background: `rgb(var(${token}))` }} />
      {/* Top row: label (left) + icon (right, compact) */}
      <div className="flex items-start justify-between gap-2">
        <p
          className="text-[0.6875rem] font-semibold uppercase tracking-wide leading-none"
          style={{ color: `rgb(var(--color-muted))` }}
        >
          {label}
        </p>
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
          style={{
            color: `rgb(var(${token}))`,
            background: `rgba(var(${token}), 0.1)`,
          }}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
      {/* Number — the hero */}
      <div className="mt-3">
        {loading ? (
          <div className="skeleton h-9 w-24" />
        ) : (
          <p
            className="mono tabular font-bold leading-none tracking-tight"
            style={{ fontSize: "2rem", color: `rgb(var(--color-fg))` }}
          >
            {value.toLocaleString("es-CO")}
          </p>
        )}
      </div>
    </div>
  )
}

const ERR_CHART_MIN_H = 120  // px — minimum bar area height (adaptive above this)
const ERR_TIP_W       = 132
const ERR_TIP_H      = 72
const ERR_TIP_OFF    = 12

function ErrorsByDayChart({ data, max }: { data: Array<{ day: string; count: number }>; max: number }) {
  const containerRef = useRef<HTMLDivElement>(null)

  // ── All refs declared first so cleanup closures are always valid ──
  const errHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const entranceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const errIsOpen    = useRef(false)

  // ── Bar entrance animation ──
  // setTimeout(50) is more reliable than double-RAF in React Strict Mode / fast re-renders.
  const [barsReady, setBarsReady] = useState(false)
  useEffect(() => {
    const noMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (noMotion) {
      setBarsReady(true)
    } else {
      entranceTimer.current = setTimeout(() => setBarsReady(true), 50)
    }
    return () => {
      if (entranceTimer.current) clearTimeout(entranceTimer.current)
      if (errHideTimer.current) clearTimeout(errHideTimer.current)
    }
  }, [])

  // ── Tooltip state ──
  const [errTip, setErrTip]               = useState<{ x: number; y: number; idx: number } | null>(null)
  const [errTipVisible, setErrTipVisible] = useState(false)

  function onErrMove(i: number, e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return
    if (errHideTimer.current) { clearTimeout(errHideTimer.current); errHideTimer.current = null }
    const r = containerRef.current.getBoundingClientRect()
    setErrTip({ x: e.clientX - r.left, y: e.clientY - r.top, idx: i })
    if (errIsOpen.current) {
      setErrTipVisible(true)
    } else {
      requestAnimationFrame(() => {
        setErrTipVisible(true)
        errIsOpen.current = true
      })
    }
  }

  function onErrLeave() {
    setErrTipVisible(false)
    errIsOpen.current = false
    errHideTimer.current = setTimeout(() => setErrTip(null), 180)
  }

  const errTipPos = useMemo(() => {
    if (!errTip || !containerRef.current) return null
    const W = containerRef.current.offsetWidth
    const cx = Math.max(ERR_TIP_W / 2 + 4, Math.min(errTip.x, W - ERR_TIP_W / 2 - 4))
    const showBelow = errTip.y < 40
    const ty = showBelow ? errTip.y + ERR_TIP_OFF : errTip.y - ERR_TIP_H - ERR_TIP_OFF
    return { left: cx, top: ty, showBelow }
  }, [errTip])

  const labelStep = data.length <= 14 ? 1 : Math.ceil(data.length / 14)

  return (
    // flex-col + flex:1 so this component fills whatever space the parent section
    // allocates after the header. The chart area (flex:1 inside) then expands to
    // match the sibling panel height instead of leaving a dead-space gap.
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", flex: 1, position: "relative", minHeight: 0 }}>

      {/* ── Tooltip ───────────────────────────────────────────────────── */}
      {errTip !== null && errTipPos !== null && data[errTip.idx] && (
        <div
          aria-live="polite"
          style={{
            position: "absolute",
            left: errTipPos.left,
            top: errTipPos.top,
            zIndex: 50,
            pointerEvents: "none",
            transform: `translateX(-50%) translateY(${errTipVisible ? "0px" : errTipPos.showBelow ? "-4px" : "4px"}) scale(${errTipVisible ? 1 : 0.96})`,
            opacity: errTipVisible ? 1 : 0,
            transition: "opacity 180ms cubic-bezier(0.16,1,0.3,1), transform 180ms cubic-bezier(0.16,1,0.3,1)",
            willChange: "transform, opacity",
          }}
        >
          {errTipPos.showBelow && (
            <div aria-hidden="true" style={{
              width: 0, height: 0, margin: "0 auto",
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderBottom: `4px solid rgb(var(--color-fg))`,
            }} />
          )}
          <div style={{
            background: `rgb(var(--color-fg))`,
            color: `rgb(var(--color-bg))`,
            borderRadius: 8,
            padding: "7px 10px",
            minWidth: ERR_TIP_W,
            boxShadow: "0 12px 32px rgba(0,0,0,0.38), 0 3px 8px rgba(0,0,0,0.2)",
          }}>
            <p style={{
              fontSize: "0.5rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              opacity: 0.5,
              fontFamily: "var(--font-mono)",
              marginBottom: 4,
            }}>
              {data[errTip.idx].day}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                display: "inline-block",
                width: 6, height: 6,
                borderRadius: 2,
                background: `rgb(var(--color-error))`,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: "0.6875rem", opacity: 0.75, fontFamily: "var(--font-sans)" }}>
                Errores
              </span>
              <span style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
                marginLeft: "auto",
              }}>
                {data[errTip.idx].count.toLocaleString("es-CO")}
              </span>
            </div>
          </div>
          {!errTipPos.showBelow && (
            <div aria-hidden="true" style={{
              width: 0, height: 0, margin: "0 auto",
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: `4px solid rgb(var(--color-fg))`,
            }} />
          )}
        </div>
      )}

      {/* ── Chart area: guide lines + bars ────────────────────────────── */}
      {/*
        flex:1 makes this div absorb all remaining height after the x-axis labels.
        minHeight ensures it never collapses to 0 on narrow viewports.
        position:relative is the containing block for the absolutely-positioned
        guide lines and bars inside.
      */}
      <div style={{ flex: 1, position: "relative", minHeight: ERR_CHART_MIN_H }}>

        {/* Guide lines — decorative only */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          {[25, 50, 75].map((pct) => (
            <div
              key={pct}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: `${pct}%`,
                height: 1,
                // rgb(R G B / A) is valid for space-separated triplet variables.
                // rgba(var(--color-border), A) is NOT valid when the variable
                // holds a space-separated triplet like "92 71 51".
                background: `rgb(var(--color-border) / 0.07)`,
              }}
            />
          ))}
          {/* Top cap + baseline */}
          <div style={{
            position: "absolute", left: 0, right: 0, top: 0, height: 1,
            background: `rgb(var(--color-border) / 0.15)`,
          }} />
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 0, height: 1,
            background: `rgb(var(--color-border) / 0.2)`,
          }} />
        </div>

        {/* Bar columns */}
        <div
          role="img"
          aria-label="Gráfico de barras: errores por día"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            gap: 3,
            zIndex: 1,
          }}
        >
          {data.map((d, i) => {
            // Math.max(4, ...) ensures at least 4% height so 1-count bars are
            // still visible. Percentage resolves against ERRORS_CHART_H px.
            const heightPct = d.count > 0 ? Math.max(4, (d.count / max) * 100) : 0
            const isHovered = errTip?.idx === i
            const staggerMs = Math.min(i * 28, 400)

            return (
              <div
                key={d.day}
                title={`${d.day}: ${d.count} error${d.count !== 1 ? "es" : ""}`}
                style={{
                  flex: 1,
                  minWidth: 0,
                  position: "relative",
                  height: "100%",       // explicit so child % resolves correctly
                }}
                onMouseMove={(e) => d.count > 0 && onErrMove(i, e)}
                onMouseLeave={d.count > 0 ? onErrLeave : undefined}
              >
                {d.count > 0 ? (
                  // Outer div controls height via %. Inner div is the visible bar.
                  // Separating them lets scaleY animate only the visual layer while
                  // the hover hit-target (outer) stays at full column height.
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${heightPct}%`,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "3px 3px 0 0",
                        // CRITICAL FIX: Use rgb() with solid color + opacity on the
                        // element itself. This avoids all CSS gradient color-parsing
                        // issues with space-separated triplet variables.
                        // rgba(var(--color-error), 0.9) → rgba(248 113 113, 0.9) INVALID.
                        // rgb(var(--color-error)) with element opacity → always valid.
                        background: `rgb(var(--color-error))`,
                        opacity: isHovered ? 0.92 : 0.72,
                        filter: isHovered ? "brightness(1.12)" : "brightness(1)",
                        transformOrigin: "bottom",
                        transform: barsReady ? "scaleY(1)" : "scaleY(0)",
                        transition: barsReady
                          ? `transform 540ms cubic-bezier(0.4,0,0.2,1) ${staggerMs}ms, opacity 0.14s ease, filter 0.14s ease`
                          : "none",
                      }}
                    />
                  </div>
                ) : (
                  // Zero-count placeholder tick
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `rgb(var(--color-border) / 0.08)`,
                    borderRadius: "2px 2px 0 0",
                  }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── X-axis labels ─────────────────────────────────────────────── */}
      <div aria-hidden="true" style={{ display: "flex", gap: 3, paddingTop: 6 }}>
        {data.map((d, i) => (
          <div key={d.day} style={{ flex: 1, minWidth: 0, textAlign: "center", overflow: "hidden" }}>
            {i % labelStep === 0 && (
              <span style={{
                fontSize: "0.5rem",
                color: `rgb(var(--color-muted))`,
                display: "block",
                lineHeight: 1,
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
              }}>
                {d.day.slice(5)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── constants ───────────────────────────────────────────────────────────────

const LEVEL_VAR: Record<string, string> = {
  error: "--color-error",
  warn:  "--color-warn",
  info:  "--color-info",
  debug: "--color-debug",
}

const LEVEL_LABEL: Record<string, string> = {
  error: "Error",
  warn:  "Warn",
  info:  "Info",
  debug: "Debug",
}

// ─── bar geometry helper ──────────────────────────────────────────────────────

interface BarSegment {
  level: "debug" | "info" | "warn" | "error"
  height: number   // px
  bottom: number   // px from bar base
  isTop: boolean
}

function buildBarSegments(
  b: LogsTimelineBucket,
  maxTotal: number,
  chartH: number,
): BarSegment[] {
  // Stack order from bottom: debug → info → warn → error (error on top)
  const order = ["debug", "info", "warn", "error"] as const
  const result: BarSegment[] = []
  let cursor = 0

  for (const level of order) {
    const count = b[level] ?? 0
    if (count === 0) continue
    const height = Math.max(2, (count / maxTotal) * chartH)
    result.push({ level, height, bottom: cursor, isTop: false })
    cursor += height
  }

  if (result.length > 0) result[result.length - 1].isTop = true
  return result
}

// ─── tooltip ─────────────────────────────────────────────────────────────────

// BucketTooltip renders card content + directional caret.
// showBelow=false → tooltip is above cursor → caret points DOWN at bottom.
// showBelow=true  → tooltip is below cursor → caret points UP at top.
function BucketTooltip({
  bucket,
  showBelow = false,
}: {
  bucket: LogsTimelineBucket
  showBelow?: boolean
}) {
  const activeRows = (["error", "warn", "info", "debug"] as const).filter(
    (lv) => bucket[lv] > 0,
  )
  const label =
    bucket.ts.length > 10
      ? bucket.ts.slice(0, 16).replace("T", " · ")
      : bucket.ts

  const card = (
    <div
      style={{
        background: `rgb(var(--color-fg))`,
        color: `rgb(var(--color-bg))`,
        borderRadius: 10,
        padding: "9px 12px",
        minWidth: 152,
        boxShadow: "0 16px 40px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.22)",
      }}
    >
      {/* Timestamp */}
      <p
        style={{
          fontSize: "0.5625rem",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 7,
          opacity: 0.55,
          fontFamily: "var(--font-mono)",
        }}
      >
        {label}
      </p>

      {/* Level rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {activeRows.map((lv) => (
          <div
            key={lv}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: 2,
                  background: `rgb(var(${LEVEL_VAR[lv]}))`,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "0.6875rem", opacity: 0.75, fontFamily: "var(--font-sans)" }}>
                {LEVEL_LABEL[lv]}
              </span>
            </span>
            <span
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {bucket[lv].toLocaleString("es-CO")}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div
        style={{
          borderTop: "1px solid rgba(0,0,0,0.14)",
          marginTop: 7,
          paddingTop: 6,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "0.625rem", opacity: 0.5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Total
        </span>
        <span
          style={{
            fontSize: "0.8125rem",
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {bucket.total.toLocaleString("es-CO")}
        </span>
      </div>
    </div>
  )

  const caretDown = (
    <div
      aria-hidden="true"
      style={{
        width: 0,
        height: 0,
        margin: "0 auto",
        borderLeft: "5px solid transparent",
        borderRight: "5px solid transparent",
        borderTop: `5px solid rgb(var(--color-fg))`,
      }}
    />
  )

  const caretUp = (
    <div
      aria-hidden="true"
      style={{
        width: 0,
        height: 0,
        margin: "0 auto",
        borderLeft: "5px solid transparent",
        borderRight: "5px solid transparent",
        borderBottom: `5px solid rgb(var(--color-fg))`,
      }}
    />
  )

  return showBelow ? <>{caretUp}{card}</> : <>{card}{caretDown}</>
}

// ─── main chart ───────────────────────────────────────────────────────────────

// Dimensions of the tooltip — used for clamping.
const TOOLTIP_W   = 164   // px  min-width of the card
const TOOLTIP_H   = 152   // px  approximate card + arrow height (calibrated)
const TOOLTIP_OFF = 14    // px  gap between cursor/bar and tooltip edge

function TimelineChart({ data }: { data: LogsTimelineBucket[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Tooltip: two-state pattern for smooth enter / exit ──
  // `tipData`    holds position + index (kept alive during exit animation)
  // `tipVisible` drives opacity/transform; set true after mount, false on leave
  const [tipData, setTipData]       = useState<{ x: number; y: number; idx: number } | null>(null)
  const [tipVisible, setTipVisible] = useState(false)
  const isOpenRef  = useRef(false)                            // sync ref to avoid stale closures
  const hideTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafHandle  = useRef<number | null>(null)

  // ── Bar entrance animation ──
  const [barsReady, setBarsReady] = useState(false)
  useEffect(() => {
    const noMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (noMotion) {
      setBarsReady(true)
    } else {
      // double RAF: first frame mounts, second frame triggers transition
      rafHandle.current = requestAnimationFrame(() => {
        rafHandle.current = requestAnimationFrame(() => setBarsReady(true))
      })
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
      if (rafHandle.current) cancelAnimationFrame(rafHandle.current)
    }
  }, [])

  // ── geometry ──
  const CHART_H  = 200
  const LABEL_H  = 22
  const GAP      = 3
  const maxTotal = Math.max(1, ...data.map((b) => b.total))
  const barWidth = Math.min(44, Math.max(8, Math.floor(560 / Math.max(data.length, 1)) - GAP))
  const labelStep = data.length <= 14 ? 1 : Math.ceil(data.length / 14)

  // ── event handlers ──
  function handleMouseMove(i: number, e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return
    // cancel any pending hide so moving between bars doesn't flash
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null }
    const r = containerRef.current.getBoundingClientRect()
    setTipData({ x: e.clientX - r.left, y: e.clientY - r.top, idx: i })
    if (isOpenRef.current) {
      // already visible — just update position/data, keep showing
      setTipVisible(true)
    } else {
      // newly mounted — wait one frame so opacity transition fires correctly
      requestAnimationFrame(() => {
        setTipVisible(true)
        isOpenRef.current = true
      })
    }
  }

  function handleMouseLeave() {
    setTipVisible(false)
    isOpenRef.current = false
    hideTimer.current = setTimeout(() => setTipData(null), 200)
  }

  // ── clamped tooltip position ──
  const tipPos = useMemo(() => {
    if (!tipData || !containerRef.current) return null
    const W = containerRef.current.offsetWidth
    const cx = Math.max(TOOLTIP_W / 2 + 4, Math.min(tipData.x, W - TOOLTIP_W / 2 - 4))
    // Show below ONLY when the cursor is very close to the container top (< 40px).
    // In all other cases show above — the tooltip can overflow the container upward,
    // which is fine because position:absolute with top:<0 overlays the section header.
    const showBelow = tipData.y < 40
    const ty = showBelow
      ? tipData.y + TOOLTIP_OFF
      : tipData.y - TOOLTIP_H - TOOLTIP_OFF
    return { left: cx, top: ty, showBelow }
  }, [tipData])

  // Enter direction: above-cursor tooltip rises from slightly below (translateY positive → 0).
  // Below-cursor tooltip drops from slightly above (translateY negative → 0).
  const enterY = tipPos?.showBelow ? "-5px" : "5px"

  return (
    <div ref={containerRef} style={{ position: "relative" }}>

      {/* ── Tooltip overlay ─────────────────────────────────────────── */}
      {tipData !== null && tipPos !== null && data[tipData.idx] && (
        <div
          aria-live="polite"
          style={{
            position: "absolute",
            left: tipPos.left,
            top: tipPos.top,
            zIndex: 50,
            pointerEvents: "none",
            // hardware-accelerated: only transform + opacity
            transform: `translateX(-50%) translateY(${tipVisible ? "0px" : enterY}) scale(${tipVisible ? 1 : 0.96})`,
            opacity: tipVisible ? 1 : 0,
            transition: "opacity 190ms cubic-bezier(0.16,1,0.3,1), transform 190ms cubic-bezier(0.16,1,0.3,1)",
            willChange: "transform, opacity",
          }}
        >
          <BucketTooltip bucket={data[tipData.idx]} showBelow={tipPos.showBelow} />
        </div>
      )}

      {/* ── Horizontal scroll wrapper ────────────────────────────────── */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ width: "fit-content", minWidth: "100%", display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative" }}>

            {/* Guide lines */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: CHART_H,
                pointerEvents: "none",
                zIndex: 0,
              }}
            >
              {[25, 50, 75].map((pct) => (
                <div
                  key={pct}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: `${pct}%`,
                    height: 1,
                    background: `rgb(var(--color-border) / 0.09)`,
                  }}
                />
              ))}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 1,
                  background: `rgb(var(--color-border) / 0.18)`,
                }}
              />
            </div>

            {/* ── Bar columns ──────────────────────────────────────────── */}
            <div
              role="img"
              aria-label="Gráfico de barras apiladas: volumen de logs por nivel"
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: GAP,
                height: CHART_H,
                position: "relative",
                zIndex: 1,
              }}
            >
              {data.map((b, i) => {
                const segments   = buildBarSegments(b, maxTotal, CHART_H)
                const isHovered  = tipData?.idx === i
                // Stagger capped so last bar in a 30-bar set doesn't wait > 420ms
                const staggerMs  = Math.min(i * 28, 420)

                return (
                  <div
                    key={b.ts}
                    title={`${b.ts}: ${b.total} registros`}
                    style={{
                      width: barWidth,
                      flexShrink: 0,
                      position: "relative",
                      height: CHART_H,
                      cursor: "default",
                    }}
                    onMouseMove={(e) => handleMouseMove(i, e)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Column hover highlight */}
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: `rgb(var(--color-border) / 0.07)`,
                        borderRadius: 4,
                        opacity: isHovered ? 1 : 0,
                        transition: "opacity 0.15s ease",
                        pointerEvents: "none",
                      }}
                    />

                    {/* Segments wrapper — scaleY entrance animation */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        transformOrigin: "bottom",
                        transform: barsReady ? "scaleY(1)" : "scaleY(0)",
                        transition: barsReady
                          ? `transform 580ms cubic-bezier(0.4,0,0.2,1) ${staggerMs}ms`
                          : "none",
                      }}
                    >
                      {segments.map((seg) => (
                        <div
                          key={seg.level}
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: seg.bottom,
                            height: seg.height,
                            background: `rgb(var(${LEVEL_VAR[seg.level]}))`,
                            opacity: isHovered ? 1 : 0.72,
                            filter: isHovered
                              ? "brightness(1.12) saturate(1.08)"
                              : "brightness(1) saturate(1)",
                            transition: "opacity 0.15s ease, filter 0.15s ease",
                            ...(seg.isTop ? { borderRadius: "4px 4px 0 0" } : {}),
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── X-axis labels ─────────────────────────────────────────── */}
            <div
              aria-hidden="true"
              style={{
                display: "flex",
                gap: GAP,
                height: LABEL_H,
                alignItems: "flex-start",
                paddingTop: 6,
              }}
            >
              {data.map((b, i) => (
                <div
                  key={b.ts}
                  style={{
                    width: barWidth,
                    flexShrink: 0,
                    textAlign: "center",
                    overflow: "hidden",
                  }}
                >
                  {i % labelStep === 0 && (
                    <span
                      style={{
                        fontSize: "0.5rem",
                        color: `rgb(var(--color-muted))`,
                        display: "block",
                        lineHeight: 1,
                        letterSpacing: "0.02em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {b.ts.length > 10 ? b.ts.slice(11, 16) : b.ts.slice(5)}
                    </span>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile-only legend */}
      <div
        className="mt-3 flex flex-wrap gap-3 sm:hidden"
        style={{ borderTop: `1px solid rgba(var(--color-border), 0.08)`, paddingTop: "0.75rem" }}
      >
        {(["error", "warn", "info", "debug"] as const).map((lv) => (
          <span
            key={lv}
            className="flex items-center gap-1.5 text-[0.625rem] font-medium uppercase tracking-wide"
            style={{ color: `rgb(var(--color-muted))` }}
          >
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ background: `rgb(var(${LEVEL_VAR[lv]}))` }}
            />
            {lv}
          </span>
        ))}
      </div>
    </div>
  )
}

function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3" style={{ animationDelay: `${i * 40}ms` }}>
          <div className="skeleton h-5 w-5 rounded" />
          <div className="skeleton h-3.5 w-36" />
          <div className="skeleton h-2 flex-1 rounded-full" />
          <div className="skeleton h-3 w-8" />
        </div>
      ))}
    </div>
  )
}

function SkeletonBars({ count = 12 }: { count?: number }) {
  return (
    <div className="flex items-end gap-1" style={{ height: 200 }}>
      {Array.from({ length: count }).map((_, i) => {
        const h = 22 + Math.abs(Math.sin(i * 0.9 + 0.4)) * 60 + 18
        return (
          <div
            key={i}
            className="skeleton flex-1 rounded-t-sm"
            style={{ height: `${h}%`, animationDelay: `${i * 45}ms` }}
          />
        )
      })}
    </div>
  )
}

function EmptyHint({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          background: `rgba(var(--color-border), 0.1)`,
          color: `rgb(var(--color-muted))`,
        }}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="max-w-[22ch] text-xs leading-relaxed" style={{ color: `rgb(var(--color-muted))` }}>
        {text}
      </p>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className="panel flex flex-col items-center justify-center gap-3 px-6 py-16 text-center animate-fade-in-up"
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{
          background: `rgba(var(--color-error), 0.1)`,
          border: `1px solid rgba(var(--color-error), 0.22)`,
        }}
      >
        <ServerCrash className="h-6 w-6" style={{ color: `rgb(var(--color-error))` }} aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: `rgb(var(--color-fg))` }}>
          Error al cargar datos
        </p>
        <p className="mt-1 text-xs" style={{ color: `rgb(var(--color-muted))` }}>{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="focus-ring mt-1 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 active:scale-[0.97]"
        style={{
          background: `rgb(var(--color-surface))`,
          border: `1px solid rgba(var(--color-border), 0.16)`,
          color: `rgb(var(--color-fg-secondary))`,
          boxShadow: `var(--shadow-sm)`,
        }}
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Reintentar
      </button>
    </div>
  )
}
