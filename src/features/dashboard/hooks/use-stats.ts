import { useQuery } from "@tanstack/react-query"
import { logsApi } from "@/core/api/logs.api"
import type { LogsStatsParams } from "@/core/models/logs"

export function useStats(params: LogsStatsParams) {
  return useQuery({
    queryKey: ["logs-stats", params],
    queryFn: () => logsApi.stats(params),
    staleTime: 30_000,
    retry: false,
  })
}

export function useTotal(params: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ["logs-total", params],
    queryFn: () => logsApi.total(params),
    staleTime: 30_000,
    retry: false,
  })
}
