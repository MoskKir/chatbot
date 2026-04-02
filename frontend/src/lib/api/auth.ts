import { request } from "../http"
import type { AuthResponse } from "@/types"

export const authApi = {
  signIn: (email: string, password: string) =>
    request<AuthResponse>("/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),

  signUp: (email: string, password: string) =>
    request<AuthResponse>("/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),

  me: () =>
    request<{ user: { id: string; email: string } | null }>("/auth/me"),
}
