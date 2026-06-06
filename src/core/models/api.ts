// Envelope estándar de la API principal: { data, meta, error }.
export interface ApiResponse<T> {
  data: T | null
  meta: MetaPage | null
  error: ApiError | null
}

export interface MetaPage {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
}
