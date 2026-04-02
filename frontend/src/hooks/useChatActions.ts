import { useCallback, type MutableRefObject } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useDeleteConversation } from "./useDeleteConversation"
import { broadcast } from "./useTabSync"
import { stopStream, removeConversation } from "@/lib/cache"
import type { Socket } from "socket.io-client"

interface ChatActionsDeps {
  activeId: string | null
  activeIdRef: MutableRefObject<string | null>
  socketRef: MutableRefObject<Socket | null>
  setActiveId: (id: string | null) => void
  signOut: () => void
}

export function useChatActions({
  activeId,
  activeIdRef,
  socketRef,
  setActiveId,
  signOut,
}: ChatActionsDeps) {
  const qc = useQueryClient()
  const deleteMutation = useDeleteConversation()

  const handleSelect = useCallback(
    (id: string) => {
      setActiveId(id)
      socketRef.current?.emit("joinConversation", { conversationId: id })
    },
    [socketRef, setActiveId],
  )

  const handleStop = useCallback(() => {
    const currentId = activeIdRef.current
    if (currentId) {
      socketRef.current?.emit("stopGeneration", { conversationId: currentId })
      stopStream(qc, currentId)
      broadcast({ type: "stopped", convId: currentId })
    }
  }, [qc, socketRef, activeIdRef])

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id)
      removeConversation(qc, id)
      if (activeId === id) setActiveId(null)
      broadcast({ type: "deleted", convId: id })
    },
    [activeId, deleteMutation, qc, setActiveId],
  )

  const handleNew = useCallback(() => setActiveId(null), [setActiveId])

  const handleSignOut = useCallback(() => {
    signOut()
    qc.clear()
    broadcast({ type: "clear" })
    setActiveId(null)
  }, [signOut, qc, setActiveId])

  return { handleSelect, handleStop, handleDelete, handleNew, handleSignOut }
}
