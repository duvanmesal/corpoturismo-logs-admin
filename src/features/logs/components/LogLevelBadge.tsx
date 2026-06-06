import type { LogLevel } from "@/core/models/logs"

const config: Record<LogLevel, { label: string; token: string }> = {
  debug: { label: "Debug", token: "--color-debug" },
  info: { label: "Info", token: "--color-info" },
  warn: { label: "Warn", token: "--color-warn" },
  error: { label: "Error", token: "--color-error" },
}

export function LogLevelBadge({ level }: { level: LogLevel }) {
  const { label, token } = config[level] ?? config.info
  return (
    <span
      className="inline-flex min-w-[4.75rem] items-center justify-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium"
      style={{
        color: `rgb(var(${token}))`,
        backgroundColor: `rgb(var(${token}) / 0.12)`,
        boxShadow: `inset 0 0 0 1px rgb(var(${token}) / 0.22)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: `rgb(var(${token}))` }}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
