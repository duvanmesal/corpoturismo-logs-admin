import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { ScrollText, LogOut, LayoutDashboard, List, Bell } from "lucide-react"
import { useAuth } from "@/shared/hooks/use-auth"
import { initials } from "@/core/utils/format"
import { cn } from "@/core/utils/cn"
import { useIncidentMonitor } from "@/features/alerts/use-incident-monitor"
import { IncidentBanner } from "@/features/alerts/IncidentBanner"
import { ThemeToggle } from "@/shared/components/ThemeToggle"

const NAV = [
  { to: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { to: "/logs", label: "Logs", icon: List },
]

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout, isLoggingOut } = useAuth()
  const incident = useIncidentMonitor()
  const incidentToken = incident.severity === "error" ? "--color-error" : "--color-warn"

  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg))]">
      <header className="sticky top-0 z-10 border-b border-[rgb(var(--color-border)/0.1)] bg-[rgb(var(--color-bg-elevated)/0.85)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgb(var(--color-primary)/0.14)] ring-1 ring-[rgb(var(--color-primary)/0.28)]">
              <ScrollText className="h-4 w-4 text-[rgb(var(--color-primary))]" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-[rgb(var(--color-fg))]">
                Panel de Logs
              </p>
              <p className="text-[0.6875rem] text-[rgb(var(--color-muted))]">Corpoturismo</p>
            </div>

            <nav className="ml-3 flex items-center gap-1 border-l border-[rgb(var(--color-border)/0.12)] pl-3">
              {NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "focus-ring inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[rgb(var(--color-primary)/0.12)] text-[rgb(var(--color-primary))]"
                        : "text-[rgb(var(--color-fg-secondary))] hover:bg-[rgb(var(--color-surface-2))]",
                    )
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <NavLink
              to="/dashboard"
              className="focus-ring relative rounded-lg p-1.5 text-[rgb(var(--color-fg-secondary))] hover:bg-[rgb(var(--color-surface-2))]"
              aria-label={incident.active ? "Incidente activo" : "Sin incidentes"}
              title={incident.active ? "Incidente activo" : "Sin incidentes"}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {incident.active && (
                <span
                  className="absolute right-1 top-1 h-2 w-2 rounded-full ring-2 ring-[rgb(var(--color-bg-elevated))]"
                  style={{ backgroundColor: `rgb(var(${incidentToken}))` }}
                  aria-hidden="true"
                />
              )}
            </NavLink>

            {user && (
              <div className="hidden items-center gap-2.5 sm:flex">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--color-primary)/0.14)] text-xs font-semibold text-[rgb(var(--color-primary))] ring-1 ring-[rgb(var(--color-primary)/0.2)]"
                  aria-hidden="true"
                >
                  {initials(user.nombres, user.apellidos, user.email)}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-medium text-[rgb(var(--color-fg))]">{user.email}</p>
                  <p className="text-[0.6875rem] text-[rgb(var(--color-muted))]">{user.rol}</p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--color-border)/0.16)] px-3 py-1.5 text-xs font-medium text-[rgb(var(--color-fg-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-2))] disabled:opacity-60"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <IncidentBanner incident={incident} />

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
