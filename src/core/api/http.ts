import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import { generateRequestId } from "@/core/utils/request-id"
import { useAuthStore } from "@/app/stores/auth-store"

const apiUrl = import.meta.env.VITE_API_URL
if (!apiUrl && import.meta.env.PROD) {
  throw new Error(
    "VITE_API_URL no está definida. No se inicia en producción sin la URL de la API.",
  )
}

export const http = axios.create({
  baseURL: apiUrl || "http://localhost:3000/api/v1",
  // Necesario para la cookie httpOnly `rt` del refresh token.
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Client-Platform": "web",
  },
  timeout: 30000,
})

// Evita múltiples refresh simultáneos: el resto espera al primero.
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: Error | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()))
  failedQueue = []
}

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!config.headers["X-Request-Id"]) {
      config.headers["X-Request-Id"] = generateRequestId()
    }
    const accessToken = useAuthStore.getState().accessToken
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url &&
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => {
            const newToken = useAuthStore.getState().accessToken
            if (newToken) originalRequest.headers.Authorization = `Bearer ${newToken}`
            return http(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await refreshAccessToken()
        processQueue()

        const newToken = useAuthStore.getState().accessToken
        if (newToken) originalRequest.headers.Authorization = `Bearer ${newToken}`
        const method = (originalRequest.method || "get").toLowerCase()
        if (method === "get" || method === "head") {
          delete (originalRequest as { data?: unknown }).data
        }
        return http(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as Error)
        useAuthStore.getState().clearSession()
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login"
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

async function refreshAccessToken(): Promise<void> {
  // WEB: el refresh usa la cookie httpOnly `rt`. Debe ir por la instancia http
  // para llevar X-Client-Platform: web y withCredentials.
  const response = await http.post("/auth/refresh", {}, { withCredentials: true })
  const accessToken = response.data?.data?.tokens?.accessToken as string | undefined

  if (!accessToken) {
    throw new Error("No access token in refresh response")
  }
  useAuthStore.getState().setAccessToken(accessToken)
}
