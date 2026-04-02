import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api as chatApi } from "@/lib/api"
import { addConversation, addOptimisticMessages, TEMP_PREFIX, PENDING_PREFIX } from "@/lib/cache"
import { truncateTitle } from "@/lib/utils"
import { broadcast } from "./useTabSync"
import type { Message, UseSendMessageOptions } from "@/types"

const MAX_MESSAGE_LENGTH = 32_000
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

let tempIdCounter = 0
function tempId() {
  return `${TEMP_PREFIX}${++tempIdCounter}`
}

export function useSendMessage({
  activeId,
  model,
  isBusy,
  socketRef,
  user,
  usage,
  setActiveId,
  setAuthOpen,
  scrollToBottom,
}: UseSendMessageOptions) {
  const qc = useQueryClient()

  return useCallback(
    async (content: string, files: File[] = []) => {
      const socket = socketRef.current
      if (!socket || isBusy) return

      if (!user && usage && usage.remaining !== null && usage.remaining <= 0) {
        setAuthOpen(true)
        return
      }

      // Validate message length
      if (content.length > MAX_MESSAGE_LENGTH) {
        toast.error(`Message too long. Maximum ${MAX_MESSAGE_LENGTH.toLocaleString()} characters.`)
        return
      }

      // Validate file sizes
      const oversized = files.filter((f) => f.size > MAX_FILE_SIZE)
      if (oversized.length > 0) {
        toast.error(`File "${oversized[0].name}" exceeds 10MB limit.`)
        return
      }

      const docFiles = files.filter((f) => !f.type.startsWith("image/"))
      const imageFiles = files.filter((f) => f.type.startsWith("image/"))

      const images = imageFiles.map((f) => ({ src: URL.createObjectURL(f), name: f.name }))
      const tempFiles = docFiles.map((f) => ({ id: tempId(), filename: f.name, mimeType: f.type }))
      const userMsg: Message = {
        id: tempId(),
        role: "user",
        content,
        timestamp: new Date(),
        images: images.length > 0 ? images : undefined,
        files: tempFiles.length > 0 ? tempFiles : undefined,
      }
      const title = truncateTitle(content)

      if (!activeId) {
        if (files.length > 0) {
          try {
            const conv = await chatApi.createConversation(title)
            const realId = conv.id
            addConversation(qc, { id: realId, title, messages: [], createdAt: new Date() })
            addOptimisticMessages(qc, realId, userMsg)
            setActiveId(realId)
            broadcast({ type: "userMessage", convId: realId, message: userMsg, title, isNew: true })
            for (const file of files) {
              await chatApi.uploadDocument(realId, file)
            }
            socket.emit("joinConversation", { conversationId: realId })
            socket.emit("sendMessage", { conversationId: realId, content, model })
          } catch {
            toast.error("Failed to upload files. Please try again.")
            return
          }
        } else {
          const pendingId = `${PENDING_PREFIX}${tempIdCounter}`
          addConversation(qc, { id: pendingId, title, messages: [], createdAt: new Date() })
          addOptimisticMessages(qc, pendingId, userMsg)
          setActiveId(pendingId)
          broadcast({ type: "userMessage", convId: pendingId, message: userMsg, title, isNew: true })
          socket.emit("sendMessage", { content, model })
        }
      } else {
        addOptimisticMessages(qc, activeId, userMsg)
        broadcast({ type: "userMessage", convId: activeId, message: userMsg, title, isNew: false })

        if (files.length > 0) {
          try {
            for (const file of files) {
              await chatApi.uploadDocument(activeId, file)
            }
          } catch {
            toast.error("Failed to upload files. Please try again.")
          }
        }

        socket.emit("sendMessage", { conversationId: activeId, content, model })
      }

      scrollToBottom(true)
    },
    [activeId, model, isBusy, scrollToBottom, socketRef, qc, user, usage, setActiveId, setAuthOpen],
  )
}
