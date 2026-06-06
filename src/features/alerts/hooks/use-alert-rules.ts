import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { alertRulesApi } from "@/core/api/alert-rules.api"
import type { CreateAlertRuleInput, UpdateAlertRuleInput } from "@/core/models/alert-rules"

const RULES_KEY = ["alert-rules"] as const

export function useAlertRules() {
  return useQuery({
    queryKey: RULES_KEY,
    queryFn: () => alertRulesApi.list(),
    staleTime: 30_000,
  })
}

export function useAlertRulesEvaluate(params?: { service?: string }) {
  return useQuery({
    queryKey: ["alert-rules", "evaluate", params],
    queryFn: () => alertRulesApi.evaluate(params),
    staleTime: 15_000,
  })
}

export function useCreateAlertRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAlertRuleInput) => alertRulesApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: RULES_KEY }),
  })
}

export function useUpdateAlertRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateAlertRuleInput }) =>
      alertRulesApi.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: RULES_KEY }),
  })
}

export function useDeleteAlertRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => alertRulesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: RULES_KEY }),
  })
}
