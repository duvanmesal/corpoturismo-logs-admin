import type { AxiosError } from "axios"
import type { ApiResponse } from "@/core/models/api"

/** Mensaje legible a partir de un error de Axios / API, sin filtrar secretos. */
export function extractApiError(error: unknown): string {
  const err = error as AxiosError<ApiResponse<unknown>>

  const apiMessage = err?.response?.data?.error?.message
  if (apiMessage) return apiMessage

  if (err?.code === "ERR_NETWORK" || err?.message === "Network Error") {
    return "Sin conexión con el servidor. Verifica tu red."
  }
  if (err?.code === "ECONNABORTED") {
    return "La solicitud tardó demasiado. Inténtalo de nuevo."
  }

  const status = err?.response?.status
  if (status === 400) return "Los datos enviados no son válidos."
  if (status === 401) return "Sesión no válida. Inicia sesión de nuevo."
  if (status === 403) return "No tienes permisos para esta acción."
  if (status === 404) return "El recurso solicitado no existe."
  if (status === 429) return "Demasiadas solicitudes. Espera un momento."
  if (status === 502) return "El servicio de logs no está disponible."
  if (status === 503) return "El servicio de logs no está configurado."
  if (status === 504) return "El servicio de logs no respondió a tiempo."
  if (status && status >= 500) return "Error interno del servidor. Inténtalo más tarde."

  return "Ocurrió un error inesperado. Inténtalo de nuevo."
}

/** Código de error de la API (para distinguir estados como 503/504 en la UI). */
export function extractApiErrorCode(error: unknown): string | undefined {
  const err = error as AxiosError<ApiResponse<unknown>>
  return err?.response?.data?.error?.code
}
