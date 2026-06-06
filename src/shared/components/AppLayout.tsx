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
  { to: "/logs", label: "Registros", icon: List },
]

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout, isLoggingOut } = useAuth()
  const incident = useIncidentMonitor()
  const incidentToken = incident.severity === "error" ? "--color-error" : "--color-warn"

  return (
    <div className="flex min-h-screen bg-[rgb(var(--color-bg))]">
      {/* ── Sidebar (desktop) ── */}
      <aside className="sidebar" aria-label="Navegación principal">
        {/* Brand */}
        <div className="sidebar__brand">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--color-primary)/0.14)] ring-1 ring-[rgb(var(--color-primary)/0.3)]">
            <ScrollText className="h-4 w-4 text-[rgb(var(--color-primary))]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight text-[rgb(var(--color-fg))]">Logs Admin</p>
            <p className="text-[0.625rem] tracking-wide text-[rgb(var(--color-muted))]">Corpoturismo</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <p className="sidebar__section-label">Panel</p>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn("sidebar__item", isActive ? "sidebar__item--active" : "sidebar__item--idle")
              }
            >
              <Icon className="h-[1.05rem] w-[1.05rem] shrink-0" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        {user && (
          <div className="sidebar__footer">
            <div className="mb-1.5 flex items-center gap-2.5 rounded-[var(--radius-md)] bg-[rgb(var(--color-surface-2))] px-3 py-2.5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--color-primary)/0.14)] text-xs font-bold text-[rgb(var(--color-primary))] ring-1 ring-[rgb(var(--color-primary)/0.2)]"
                aria-hidden="true"
              >
                {initials(user.nombres, user.apellidos, user.email)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[rgb(var(--color-fg))]">{user.email}</p>
                <p className="truncate text-[0.6rem] capitalize text-[rgb(var(--color-muted))]">{user.rol}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="focus-ring flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-xs font-medium text-[rgb(var(--color-muted))] transition-colors hover:bg-[rgb(var(--color-surface-2))] hover:text-[rgb(var(--color-fg-secondary))] disabled:opacity-60"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        )}
      </aside>

      {/* ── Content area ── */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-56">
        {/* Top bar */}
        <header className="sticky top-0 z-10 border-b border-[rgb(var(--color-border)/0.1)] bg-[rgb(var(--color-bg-elevated)/0.85)] backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            {/* Mobile brand */}
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgb(var(--color-primary)/0.14)] ring-1 ring-[rgb(var(--color-primary)/0.28)]">
                <ScrollText className="h-3.5 w-3.5 text-[rgb(var(--color-primary))]" aria-hidden="true" />
              </div>
              <span className="text-sm font-bold tracking-tight text-[rgb(var(--color-fg))]">Logs Admin</span>
            </div>

            {/* Mobile nav */}
            <nav className="flex items-center gap-1 lg:hidden" aria-label="Navegación">
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

            <div className="flex-1" />

            {/* Right actions */}
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

              {/* Mobile avatar */}
              {user && (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--color-primary)/0.14)] text-xs font-bold text-[rgb(var(--color-primary))] ring-1 ring-[rgb(var(--color-primary)/0.2)] lg:hidden"
                  aria-hidden="true"
                >
                  {initials(user.nombres, user.apellidos, user.email)}
                </div>
              )}
            </div>
          </div>
        </header>

        <IncidentBanner incident={incident} />

        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  )
}
