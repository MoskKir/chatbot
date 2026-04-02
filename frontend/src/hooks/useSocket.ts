import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { API_URL } from "@/lib/http"
import { getFingerprint } from "@/lib/tokens"

/**
 * Manages the Socket.IO connection.
 * Returns a ref to the socket and a version counter that increments
 * every time the socket is recreated (e.g. after token change).
 * Consumers that register event handlers must depend on `version`
 * to re-register when the socket changes.
 */
export function useSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const socket = io(API_URL, {
      auth: {
        token: token ?? undefined,
        fingerprint: token ? undefined : getFingerprint(),
      },
    })
    socketRef.current = socket
    setVersion((v) => v + 1)

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [token])

  return { socketRef, version }
}
