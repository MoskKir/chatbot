import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { conversationKey } from "./useConversationMessages"
import { broadcast } from "./useTabSync"
import {
  replaceTempMessage,
  swapPendingConversation,
  updateConversationTitle,
  transitionToStreaming,
  appendStreamChunk,
  finalizeStream,
  removeThinking,
  updateUsage,
  toMessage,
  THINKING_ID,
  STREAMING_ID,
  PENDING_PREFIX,
} from "@/lib/cache"
import { truncateTitle } from "@/lib/utils"
import type { UseSocketEventsOptions } from "@/types"

export { THINKING_ID, STREAMING_ID }

export function useSocketEvents({
  socketRef,
  socketVersion,
  activeIdRef,
  setActiveId,
  setAuthOpen,
}: UseSocketEventsOptions) {
  const qc = useQueryClient()

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    const onMessageSaved = (data: { message: any; conversationId: string }) => {
      if (!data?.conversationId || !data?.message?.id) return
      const serverMsg = toMessage(data.message)
      const convId = data.conversationId
      const currentActiveId = activeIdRef.current
      let prevConvId: string | undefined

      if (currentActiveId?.startsWith(PENDING_PREFIX)) {
        prevConvId = currentActiveId
        swapPendingConversation(qc, currentActiveId, convId, serverMsg)
        setActiveId(convId)
        socket.emit("joinConversation", { conversationId: convId })
      } else {
        replaceTempMessage(qc, convId, serverMsg)
      }

      if (prevConvId) {
        updateConversationTitle(qc, convId, truncateTitle(serverMsg.content))
      }

      broadcast({ type: "messageSaved", convId, message: serverMsg, prevConvId })
    }

    const onStreamStart = (data: { conversationId: string }) => {
      if (!data?.conversationId) return
      transitionToStreaming(qc, data.conversationId)
      broadcast({ type: "streamStart", convId: data.conversationId })
    }

    let chunkBuffer = ""
    let chunkConvId = ""
    let flushTimer: ReturnType<typeof setTimeout> | null = null

    const flushChunks = () => {
      if (!chunkBuffer || !chunkConvId) return
      const buffered = chunkBuffer
      const convId = chunkConvId
      chunkBuffer = ""
      appendStreamChunk(qc, convId, buffered)
      broadcast({ type: "streamChunk", convId, chunk: buffered })
    }

    const onStreamChunk = (data: { conversationId: string; chunk: string }) => {
      if (!data?.conversationId || typeof data.chunk !== "string") return
      chunkBuffer += data.chunk
      chunkConvId = data.conversationId
      if (!flushTimer) {
        flushTimer = setTimeout(() => {
          flushTimer = null
          flushChunks()
        }, 30)
      }
    }

    const onStreamEnd = (data: { message: any; conversationId: string }) => {
      if (flushTimer) { clearTimeout(flushTimer); flushTimer = null }
      chunkBuffer = ""

      if (!data?.conversationId || !data?.message?.id) return
      const finalMsg = toMessage(data.message)
      finalizeStream(qc, data.conversationId, finalMsg)
      broadcast({ type: "streamEnd", convId: data.conversationId, message: finalMsg })
    }

    const onStreamAborted = (data: { conversationId: string }) => {
      qc.invalidateQueries({ queryKey: conversationKey(data.conversationId), refetchType: "none" })
    }

    const onUsageUpdate = (data: { remaining: number }) => {
      if (!data || typeof data.remaining !== "number") return
      updateUsage(qc, data.remaining)
      broadcast({ type: "usageUpdate", remaining: data.remaining })
    }

    const onError = (data: { code?: string; message?: string }) => {
      if (!data || typeof data !== "object") return

      const currentId = activeIdRef.current
      if (currentId) {
        removeThinking(qc, currentId)
      }

      if (data.code === "ANON_LIMIT") {
        setAuthOpen(true)
      } else if (data.code === "RATE_LIMIT") {
        toast.warning("Too many messages. Please wait a moment.")
      } else if (data.code === "FORBIDDEN") {
        toast.error("Access denied.")
      } else if (data.code === "VALIDATION") {
        toast.error(data.message ?? "Invalid input.")
      } else {
        toast.error("Something went wrong. Please try again.")
      }
    }

    socket.on("messageSaved", onMessageSaved)
    socket.on("streamStart", onStreamStart)
    socket.on("streamChunk", onStreamChunk)
    socket.on("streamEnd", onStreamEnd)
    socket.on("streamAborted", onStreamAborted)
    socket.on("usageUpdate", onUsageUpdate)
    socket.on("error", onError)

    return () => {
      socket.off("messageSaved", onMessageSaved)
      socket.off("streamStart", onStreamStart)
      socket.off("streamChunk", onStreamChunk)
      socket.off("streamEnd", onStreamEnd)
      socket.off("streamAborted", onStreamAborted)
      socket.off("usageUpdate", onUsageUpdate)
      socket.off("error", onError)
      if (flushTimer) clearTimeout(flushTimer)
    }
  }, [socketRef, socketVersion, qc, activeIdRef, setActiveId, setAuthOpen])
}
