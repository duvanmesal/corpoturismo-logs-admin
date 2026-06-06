import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { authApi, usersApi } from "@/core/api/auth.api"
import { useAuthStore } from "@/app/stores/auth-store"
import type { LoginRequest } from "@/core/models/auth"

export function useAuth() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, setSession, updateUser, clearSession } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async (response, variables) => {
      if (!response.data) return
      const accessToken = response.data.tokens.accessToken
      setSession(response.data.user, accessToken, {
        rememberMe: variables.rememberMe === true,
      })

      // Hidratar identidad real (profileStatus + emailVerifiedAt) antes de navegar.
      try {
        const me = await usersApi.getMe()
        if (me.data) {
          updateUser(me.data)
          queryClient.setQueryData(["me"], me.data)
        }
      } catch {
        // El guard volverá a intentar /users/me; no bloqueamos el login aquí.
      }
      navigate("/dashboard", { replace: true })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearSession()
      queryClient.clear()
      navigate("/login", { replace: true })
    },
    onError: () => {
      // Aunque el logout remoto falle, limpiamos la sesión local.
      clearSession()
      queryClient.clear()
      navigate("/login", { replace: true })
    },
  })

  // Identidad real. Si no hay accessToken (recarga), intenta refrescar primero.
  const { data: meData, isLoading: isLoadingMe } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const state = useAuthStore.getState()
      if (!state.accessToken) {
        const refreshed = await authApi.refresh()
        const token = refreshed.data?.tokens.accessToken
        if (token) useAuthStore.getState().setAccessToken(token)
      }
      const response = await usersApi.getMe()
      return response.data
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: false,
  })

  useEffect(() => {
    if (meData) updateUser(meData)
  }, [meData, updateUser])

  return {
    user: meData || user,
    isAuthenticated,
    isLoading: isLoadingMe,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  }
}
