// Roles. Objeto `as const` (no enum) para cumplir verbatimModuleSyntax.
export const Rol = {
  SUPER_ADMIN: "SUPER_ADMIN",
  SUPERVISOR: "SUPERVISOR",
  GUIA: "GUIA",
} as const
export type Rol = (typeof Rol)[keyof typeof Rol]

export type ProfileStatus = "INCOMPLETE" | "COMPLETE"

export interface User {
  id: string
  email: string
  nombres: string | null
  apellidos: string | null
  rol: Rol
  activo: boolean
  emailVerifiedAt?: string | null
  profileStatus?: ProfileStatus
  createdAt?: string
  updatedAt?: string
}

export interface Tokens {
  accessToken: string
  accessTokenExpiresIn?: number
  refreshTokenExpiresAt?: string
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  user: User
  tokens: Tokens
  session: { id: string }
}

export interface RefreshResponse {
  tokens: Tokens
  session: { id: string }
}
