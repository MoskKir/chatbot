export interface AuthUser {
  id: string
  email: string
}

export interface AuthResponse {
  user?: { id: string; email: string }
  session?: { access_token: string; expires_at: number }
  error?: string
}
