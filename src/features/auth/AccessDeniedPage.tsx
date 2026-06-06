import { ShieldX, LogOut } from "lucide-react"
import { useAuth } from "@/shared/hooks/use-auth"

interface AccessDeniedPageProps {
  title?: string
  reason?: string
}

export function AccessDeniedPage({
  title = "Acceso denegado",
  reason = "Tu cuenta no tiene permisos para consultar el panel de logs. Solo personal autorizado (administradores y supervisores) puede acceder.",
}: AccessDeniedPageProps) {
  const { user, logout, isLoggingOut } = useAuth()

  return (
    <div className="app-grid-bg flex min-h-screen items-center justify-center bg-[rgb(var(--color-bg))] p-6">
      <div className="panel animate-fade-in-up w-full max-w-md p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgb(var(--color-error)/0.12)] ring-1 ring-[rgb(var(--color-error)/0.25)]">
          <ShieldX className="h-6 w-6 text-[rgb(var(--color-error))]" aria-hidden="true" />
        </div>

        <h1 className="mt-5 text-xl font-semibold tracking-tight text-[rgb(var(--color-fg))]">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--color-fg-secondary))]">
          {reason}
        </p>

        {user?.email && (
          <p className="mt-4 text-xs text-[rgb(var(--color-muted))]">
            Sesión iniciada como{" "}
            <span className="mono text-[rgb(var(--color-fg-secondary))]">{user.email}</span>
          </p>
        )}

        <button
          type="button"
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="focus-ring mt-6 inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface-2))] px-4 py-2 text-sm font-medium text-[rgb(var(--color-fg))] transition-colors hover:bg-[rgb(var(--color-surface-2)/0.7)] disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
