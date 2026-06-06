export type AlertRuleLevel = "error" | "warn"

export interface AlertRule {
  id: string
  name: string
  description?: string
  level: AlertRuleLevel
  windowMinutes: number
  threshold: number
  service?: string
  module?: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface AlertRuleEvaluation {
  ruleId: string
  name: string
  level: AlertRuleLevel
  triggered: boolean
  count: number
  threshold: number
  windowMinutes: number
  service?: string
  module?: string
}

export interface CreateAlertRuleInput {
  name: string
  description?: string
  level: AlertRuleLevel
  windowMinutes: number
  threshold: number
  service?: string
  module?: string
  enabled?: boolean
}

export type UpdateAlertRuleInput = Partial<CreateAlertRuleInput>
