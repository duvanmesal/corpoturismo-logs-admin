import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { logsApi } from "@/core/api/logs.api"
import type { LogsListParams } from "@/core/models/logs"

export function useLogs(params: LogsListParams) {
  return useQuery({
    queryKey: ["logs", params],
    queryFn: () => logsApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    retry: false,
  })
}
