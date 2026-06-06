import { Sun, Moon } from "lucide-react"
import { useThemeStore } from "@/app/stores/theme-store"

export function ThemeToggle() {
  const { mode, toggle } = useThemeStore()
  const isDark = mode === "dark"

  return (
    <button
      type="button"
      onClick={toggle}
      className="focus-ring relative h-8 w-8 rounded-lg text-[rgb(var(--color-fg-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-2))]"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      <Sun
        className={`absolute inset-0 m-auto h-4 w-4 transition-all duration-300 ${
          isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
        aria-hidden="true"
      />
      <Moon
        className={`absolute inset-0 m-auto h-4 w-4 transition-all duration-300 ${
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        }`}
        aria-hidden="true"
      />
    </button>
  )
}
