import { useRef, useEffect } from "react"
import type { QueryClient } from "@tanstack/react-query"

export function useAuthCacheSync(
  userId: string | undefined,
  qc: QueryClient,
  resetActiveId: () => void,
) {
  const prevUserId = useRef<string | undefined | null>(undefined)

  useEffect(() => {
    if (prevUserId.current === undefined) {
      prevUserId.current = userId ?? null
      return
    }
    if (prevUserId.current !== (userId ?? null)) {
      prevUserId.current = userId ?? null
      qc.clear()
      resetActiveId()
    }
  }, [userId, qc, resetActiveId])
}
