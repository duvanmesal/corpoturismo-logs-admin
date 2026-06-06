import { create } from "zustand"

export type ThemeMode = "light" | "dark"
const STORAGE_KEY = "logs-admin-theme"

function readStored(): ThemeMode {
  if (typeof window === "undefined") return "light"
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === "dark" ? "dark" : "light"
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return
  document.documentElement.classList.toggle("dark", mode === "dark")
}

// Lee y aplica al importar el módulo (antes del render) para evitar parpadeo.
const initialMode = readStored()
applyTheme(initialMode)

interface ThemeState {
  mode: ThemeMode
  toggle: () => void
  setMode: (mode: ThemeMode) => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode,
  toggle: () => get().setMode(get().mode === "dark" ? "light" : "dark"),
  setMode: (mode) => {
    applyTheme(mode)
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, mode)
    set({ mode })
  },
}))
