import { Navigate, useLocation } from "react-router-dom"
import type { ReactNode } from "react"
import type { Rol } from "@/core/models/auth"
import { useAuth } from "@/shared/hooks/use-auth"
import { FullPageLoader } from "@/shared/components/Spinner"
import { AccessDeniedPage } from "@/features/auth/AccessDeniedPage"

/**
 * Solo permite sesiones autenticadas, con email verificado y perfil completo.
 * El gate de rol se aplica aparte con <RequireRoles>.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageLoader />

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user && !user.emailVerifiedAt) {
    return (
      <AccessDeniedPage
        reason="Tu correo no está verificado. Verifícalo desde el sistema principal para acceder al panel de logs."
        title="Correo sin verificar"
      />
    )
  }

  if (user && user.profileStatus && user.profileStatus !== "COMPLETE") {
    return (
      <AccessDeniedPage
        reason="Debes completar tu perfil en el sistema principal antes de usar el panel de logs."
        title="Perfil incompleto"
      />
    )
  }

  return <>{children}</>
}

/** Restringe por rol. Usuarios sin permiso ven la pantalla de acceso denegado. */
export function RequireRoles({
  children,
  allowedRoles,
}: {
  children: ReactNode
  allowedRoles: Rol[]
}) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <FullPageLoader />

  if (!user || !allowedRoles.includes(user.rol)) {
    return <AccessDeniedPage />
  }

  return <>{children}</>
}

/** Si ya hay sesión, no muestra el login: redirige al panel. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <FullPageLoader />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}
