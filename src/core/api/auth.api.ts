import { http } from "./http"
import type { ApiResponse } from "@/core/models/api"
import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  User,
} from "@/core/models/auth"

export const authApi = {
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const res = await http.post<ApiResponse<LoginResponse>>("/auth/login", data, {
      withCredentials: true,
    })
    return res.data
  },

  async refresh(): Promise<ApiResponse<RefreshResponse>> {
    const res = await http.post<ApiResponse<RefreshResponse>>(
      "/auth/refresh",
      {},
      { withCredentials: true },
    )
    return res.data
  },

  async logout(): Promise<void> {
    await http.post("/auth/logout")
  },
}

export const usersApi = {
  // Identidad completa (incluye profileStatus + emailVerifiedAt) para los guards.
  async getMe(): Promise<ApiResponse<User>> {
    const res = await http.get<ApiResponse<User>>("/users/me")
    return res.data
  },
}
