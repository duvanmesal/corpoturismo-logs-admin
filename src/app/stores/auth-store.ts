import { create } from "zustand"
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware"
import type { User } from "@/core/models/auth"

const AUTH_STORAGE_KEY = "logs-admin-auth"
const AUTH_MODE_KEY = "logs-admin-auth-mode"
type Mode = "local" | "session"

function browserStorage(mode: Mode): Storage | undefined {
  if (typeof window === "undefined") return undefined
  return mode === "local" ? window.localStorage : window.sessionStorage
}

function setMode(mode: Mode) {
  if (typeof window !== "undefined") window.localStorage.setItem(AUTH_MODE_KEY, mode)
}

// Persistimos solo identidad (user + isAuthenticated). El accessToken vive en
// memoria y nunca se escribe en el navegador.
const authStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null
    const mode = window.localStorage.getItem(AUTH_MODE_KEY)
    if (mode === "local" || mode === "session") {
      return browserStorage(mode)?.getItem(name) ?? null
    }
    return window.sessionStorage.getItem(name) ?? window.localStorage.getItem(name)
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return
    const mode: Mode =
      window.localStorage.getItem(AUTH_MODE_KEY) === "local" ? "local" : "session"
    browserStorage(mode)?.setItem(name, value)
    browserStorage(mode === "local" ? "session" : "local")?.removeItem(name)
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return
    window.localStorage.removeItem(name)
    window.sessionStorage.removeItem(name)
    window.localStorage.removeItem(AUTH_MODE_KEY)
  },
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setSession: (user: User, accessToken: string, options?: { rememberMe?: boolean }) => void
  setAccessToken: (accessToken: string) => void
  updateUser: (user: User) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setSession: (user, accessToken, options) => {
        if (options) setMode(options.rememberMe === true ? "local" : "session")
        set({ user, accessToken, isAuthenticated: true })
      },

      setAccessToken: (accessToken) => set({ accessToken, isAuthenticated: true }),

      updateUser: (user) => set({ user }),

      clearSession: () => {
        authStorage.removeItem(AUTH_STORAGE_KEY)
        set({ user: null, accessToken: null, isAuthenticated: false })
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => authStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
