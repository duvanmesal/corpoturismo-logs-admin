import { useQuery } from "@tanstack/react-query"
import { logsApi } from "@/core/api/logs.api"
import type { LogsTimelineParams } from "@/core/models/logs"

export function useTimeline(params: LogsTimelineParams) {
  return useQuery({
    queryKey: ["logs", "timeline", params],
    queryFn: () => logsApi.timeline(params),
    staleTime: 60_000,
  })
}
