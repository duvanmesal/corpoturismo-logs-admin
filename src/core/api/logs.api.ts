import { http } from "./http"
import type { ApiResponse } from "@/core/models/api"
import type {
  LogItem,
  LogsListParams,
  LogsStats,
  LogsStatsParams,
  LogsFacets,
  LogsFacetsParams,
  LogsTimelineBucket,
  LogsTimelineParams,
} from "@/core/models/logs"

// Solo lectura contra el proxy seguro de la API principal.
// La API valida rol/sesión y consulta el LogService con su clave interna.
export const logsApi = {
  async list(params: LogsListParams): Promise<ApiResponse<LogItem[]>> {
    const res = await http.get<ApiResponse<LogItem[]>>("/admin/logs", {
      params: cleanParams(params),
    })
    return res.data
  },

  async getById(id: string): Promise<ApiResponse<LogItem>> {
    const res = await http.get<ApiResponse<LogItem>>(`/admin/logs/${id}`)
    return res.data
  },

  async stats(params: LogsStatsParams): Promise<ApiResponse<LogsStats>> {
    const res = await http.get<ApiResponse<LogsStats>>("/admin/logs/stats", {
      params: cleanParams(params),
    })
    return res.data
  },

  // Total de registros que cumplen el filtro (vía meta.total con limit=1).
  async total(params: LogsListParams): Promise<number> {
    const res = await http.get<ApiResponse<LogItem[]>>("/admin/logs", {
      params: cleanParams({ ...params, page: 1, limit: 1 }),
    })
    return res.data.meta?.total ?? 0
  },

  async facets(params: LogsFacetsParams): Promise<ApiResponse<LogsFacets>> {
    const res = await http.get<ApiResponse<LogsFacets>>("/admin/logs/facets", {
      params: cleanParams(params),
    })
    return res.data
  },

  async timeline(params: LogsTimelineParams): Promise<ApiResponse<LogsTimelineBucket[]>> {
    const res = await http.get<ApiResponse<LogsTimelineBucket[]>>("/admin/logs/timeline", {
      params: cleanParams(params),
    })
    return res.data
  },

  // Export: la descarga la genera la API (no el frontend). Requiere from/to.
  // Devuelve el Blob; el servidor controla formato, rango y cap de filas.
  async export(filters: LogsExportFilters, format: "csv" | "json"): Promise<Blob> {
    const res = await http.get("/admin/logs/export", {
      params: cleanParams({ ...filters, format }),
      responseType: "blob",
    })
    return res.data as Blob
  },
}

// Filtros válidos para export (sin page/limit/order; el schema del proxy es estricto).
export type LogsExportFilters = Omit<LogsListParams, "page" | "limit" | "order"> & {
  from: string
  to: string
}

/** Elimina filtros vacíos para no mandar query params inútiles. */
function cleanParams(params: object): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    out[key] = value
  }
  return out
}
