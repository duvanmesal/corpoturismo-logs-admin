// Contrato de cara al panel. Los nombres de los filtros coinciden con los que
// expone el proxy /admin/logs de la API principal (no con el LogService crudo).

export const LogLevel = {
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
} as const
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel]

export interface LogActor {
  userId?: string
  email?: string
  role?: string
}

export interface LogHttp {
  method?: string
  path?: string
  status?: number
  ip?: string
  userAgent?: string
  durationMs?: number
}

export interface LogTarget {
  entity?: string
  id?: string
  email?: string
}

export interface LogItem {
  _id?: string
  id?: string
  level: LogLevel
  event: string
  message?: string
  service?: string
  requestId?: string
  actor?: LogActor
  target?: LogTarget
  http?: LogHttp
  meta?: Record<string, unknown>
  ts: string
}

// Estadísticas agregadas (proxy /admin/logs/stats).
export interface LogsStats {
  byLevel: Array<{ level: string; count: number }>
  topEvents: Array<{ event: string; count: number }>
  errorsByDay: Array<{ day: string; count: number }>
}

export interface LogsStatsParams {
  from?: string
  to?: string
  level?: LogLevel
  service?: string
  action?: string
  userId?: string
  module?: string
  topEventsLimit?: number
  tz?: string
}

// Filtros del panel. Fase 3 añade method/statusCode/module (soportados por el proxy).
export interface LogsListParams {
  page?: number
  limit?: number
  level?: LogLevel
  service?: string
  action?: string
  userId?: string
  requestId?: string
  q?: string
  from?: string
  to?: string
  method?: string
  statusCode?: number
  module?: string
  order?: "asc" | "desc"
}
