const FINGERPRINT_KEY = "anon_fingerprint"

/**
 * Access token lives in memory only — invisible to XSS via localStorage.
 * Refresh token lives in an HttpOnly cookie — managed entirely by the server.
 */
let accessToken: string | null = null

export function getFingerprint(): string {
  let fp = localStorage.getItem(FINGERPRINT_KEY)
  if (!fp) {
    fp = crypto.randomUUID()
    localStorage.setItem(FINGERPRINT_KEY, fp)
  }
  return fp
}

export function getToken(): string | null {
  return accessToken
}

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(access: string) {
  accessToken = access
}

export function clearTokens() {
  accessToken = null
}

/** Event name used for cross-tab auth sync */
export const AUTH_SYNC_KEY = "auth_sync"
