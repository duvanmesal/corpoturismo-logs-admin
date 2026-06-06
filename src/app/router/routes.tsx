import { createBrowserRouter, Navigate } from "react-router-dom"
import { Rol } from "@/core/models/auth"
import { GuestRoute, ProtectedRoute, RequireRoles } from "./guards"
import { AppLayout } from "@/shared/components/AppLayout"
import { LoginPage } from "@/features/auth/LoginPage"
import { LogsPage } from "@/features/logs/LogsPage"
import { LogDetailPage } from "@/features/logs/LogDetailPage"
import { DashboardPage } from "@/features/dashboard/DashboardPage"
import type { ReactNode } from "react"

function adminArea(page: ReactNode) {
  return (
    <ProtectedRoute>
      <RequireRoles allowedRoles={[Rol.SUPER_ADMIN, Rol.SUPERVISOR]}>
        <AppLayout>{page}</AppLayout>
      </RequireRoles>
    </ProtectedRoute>
  )
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  { path: "/dashboard", element: adminArea(<DashboardPage />) },
  { path: "/logs", element: adminArea(<LogsPage />) },
  { path: "/logs/:id", element: adminArea(<LogDetailPage />) },
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
])
