import { useState, useEffect, useCallback } from "react"
import { authApi } from "@/lib/api"
import { clearTokens, getAccessToken, setAccessToken, AUTH_SYNC_KEY } from "@/lib/tokens"
import { API_URL } from "@/lib/http"
import type { AuthUser } from "@/types"

/** BroadcastChannel for cross-tab auth sync */
let authChannel: BroadcastChannel | null = null
try {
  authChannel = new BroadcastChannel(AUTH_SYNC_KEY)
} catch {
  // BroadcastChannel not supported
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => getAccessToken())
  const [loading, setLoading] = useState(true)

  // On mount: try to restore session via HttpOnly refresh cookie
  useEffect(() => {
    const existing = getAccessToken()
    if (existing) {
      authApi
        .me()
        .then((data) => setUser(data.user))
        .catch(() => {
          clearTokens()
          setToken(null)
          setUser(null)
        })
        .finally(() => setLoading(false))
      return
    }

    // No access token in memory — try refresh via HttpOnly cookie
    fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.session?.access_token) {
          setAccessToken(data.session.access_token)
          setToken(data.session.access_token)
          return authApi.me()
        }
        return null
      })
      .then((data) => {
        if (data) setUser(data.user)
      })
      .catch(() => {
        clearTokens()
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Cross-tab sync via BroadcastChannel
  useEffect(() => {
    if (!authChannel) return

    const handler = (e: MessageEvent) => {
      if (e.data?.type === "logout") {
        clearTokens()
        setToken(null)
        setUser(null)
      } else if (e.data?.type === "login" && e.data.accessToken) {
        setAccessToken(e.data.accessToken)
        setToken(e.data.accessToken)
        authApi
          .me()
          .then((data) => setUser(data.user))
          .catch(() => {
            clearTokens()
            setToken(null)
            setUser(null)
          })
      }
    }

    authChannel.addEventListener("message", handler)
    return () => authChannel!.removeEventListener("message", handler)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await authApi.signIn(email, password)
    if (res.error) throw new Error(res.error)
    if (res.session) {
      setAccessToken(res.session.access_token)
      setToken(res.session.access_token)
      authChannel?.postMessage({ type: "login", accessToken: res.session.access_token })
    }
    setUser(res.user ?? null)
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const res = await authApi.signUp(email, password)
    if (res.error) throw new Error(res.error)
    if (res.session) {
      setAccessToken(res.session.access_token)
      setToken(res.session.access_token)
      authChannel?.postMessage({ type: "login", accessToken: res.session.access_token })
    }
    setUser(res.user ?? null)
  }, [])

  const signOut = useCallback(async () => {
    // Tell server to clear the HttpOnly cookie
    try {
      await fetch(`${API_URL}/api/auth/sign-out`, {
        method: "POST",
        credentials: "include",
      })
    } catch {
      // ignore — cookie will expire anyway
    }
    clearTokens()
    setToken(null)
    setUser(null)
    authChannel?.postMessage({ type: "logout" })
  }, [])

  return { user, loading, signIn, signUp, signOut, token }
}
