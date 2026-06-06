import { Loader2 } from "lucide-react"
import { cn } from "@/core/utils/cn"

interface SpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-9 w-9" } as const

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin text-[rgb(var(--color-primary))]",
        sizeMap[size],
        className,
      )}
      aria-hidden="true"
    />
  )
}

export function FullPageLoader({ label = "Verificando sesión…" }: { label?: string }) {
  return (
    <div className="app-grid-bg flex min-h-screen flex-col items-center justify-center gap-4 bg-[rgb(var(--color-bg))]">
      <Spinner size="lg" />
      <p className="text-sm text-[rgb(var(--color-muted))]">{label}</p>
    </div>
  )
}
