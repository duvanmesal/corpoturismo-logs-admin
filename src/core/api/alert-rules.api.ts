import { http } from "./http"
import type { ApiResponse } from "@/core/models/api"
import type {
  AlertRule,
  AlertRuleEvaluation,
  CreateAlertRuleInput,
  UpdateAlertRuleInput,
} from "@/core/models/alert-rules"

export const alertRulesApi = {
  async list(): Promise<ApiResponse<AlertRule[]>> {
    const res = await http.get<ApiResponse<AlertRule[]>>("/admin/logs/alerts/rules")
    return res.data
  },

  async getById(id: string): Promise<ApiResponse<AlertRule>> {
    const res = await http.get<ApiResponse<AlertRule>>(`/admin/logs/alerts/rules/${id}`)
    return res.data
  },

  async evaluate(params?: { service?: string }): Promise<ApiResponse<AlertRuleEvaluation[]>> {
    const res = await http.get<ApiResponse<AlertRuleEvaluation[]>>("/admin/logs/alerts/evaluate", {
      params,
    })
    return res.data
  },

  async create(input: CreateAlertRuleInput): Promise<ApiResponse<AlertRule>> {
    const res = await http.post<ApiResponse<AlertRule>>("/admin/logs/alerts/rules", input)
    return res.data
  },

  async update(id: string, patch: UpdateAlertRuleInput): Promise<ApiResponse<AlertRule>> {
    const res = await http.patch<ApiResponse<AlertRule>>(`/admin/logs/alerts/rules/${id}`, patch)
    return res.data
  },

  async delete(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    const res = await http.delete<ApiResponse<{ deleted: boolean }>>(`/admin/logs/alerts/rules/${id}`)
    return res.data
  },
}
