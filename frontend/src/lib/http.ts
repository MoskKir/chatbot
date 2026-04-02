import { getToken, getFingerprint, setAccessToken, clearTokens } from "./tokens"

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

// Warn if production and not HTTPS
if (
  import.meta.env.PROD &&
  API_URL.startsWith("http://") &&
  !API_URL.includes("localhost")
) {
  console.warn(
    "[Security] API URL uses HTTP in production. Tokens may be transmitted in plaintext. Use HTTPS.",
  )
}

let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      // No body needed — refresh token is sent via HttpOnly cookie
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        clearTokens()
        return false
      }

      const data = await res.json()
      if (data.session?.access_token) {
        setAccessToken(data.session.access_token)
        return true
      }

      clearTokens()
      return false
    } catch {
      clearTokens()
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const doFetch = (token: string | null) => {
    const headers: Record<string, string> = {
      ...(init?.headers as Record<string, string>),
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    } else {
      headers["X-Anon-Fingerprint"] = getFingerprint()
    }

    return fetch(`${API_URL}/api${path}`, {
      ...init,
      headers,
      credentials: "include", // send HttpOnly cookies
    })
  }

  let res = await doFetch(getToken())

  // Auto-refresh on 401
  if (res.status === 401) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      res = await doFetch(getToken())
    }
  }

  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}
