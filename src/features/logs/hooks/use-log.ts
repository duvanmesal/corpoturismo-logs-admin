import { useQuery } from "@tanstack/react-query"
import { logsApi } from "@/core/api/logs.api"

/** Detalle de un único log por id (proxy /admin/logs/:id). */
export function useLog(id: string | undefined) {
  return useQuery({
    queryKey: ["log", id],
    queryFn: () => logsApi.getById(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: false,
  })
}
