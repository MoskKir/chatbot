import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  addConversation,
  addOptimisticMessages,
  replaceTempMessage,
  swapPendingConversation,
  updateConversationTitle,
  transitionToStreaming,
  appendStreamChunk,
  finalizeStream,
  stopStream,
  removeConversation,
  updateUsage,
} from "@/lib/cache"
import { truncateTitle } from "@/lib/utils"
import type { SyncEvent } from "@/types"

const CHANNEL_NAME = "chatbot-sync"

let channel: BroadcastChannel | null = null

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME)
  return channel
}

export function broadcast(event: SyncEvent) {
  getChannel()?.postMessage(event)
}

export function useTabSync() {
  const qc = useQueryClient()

  useEffect(() => {
    const ch = getChannel()
    if (!ch) return

    const handler = (e: MessageEvent<SyncEvent>) => {
      const evt = e.data

      switch (evt.type) {
        case "userMessage": {
          if (evt.isNew) {
            addConversation(qc, {
              id: evt.convId,
              title: evt.title,
              messages: [],
              createdAt: new Date(),
            })
          }
          addOptimisticMessages(qc, evt.convId, evt.message)
          break
        }

        case "messageSaved": {
          if (evt.prevConvId && evt.prevConvId !== evt.convId) {
            swapPendingConversation(qc, evt.prevConvId, evt.convId, evt.message)
          } else {
            replaceTempMessage(qc, evt.convId, evt.message)
          }
          if (evt.prevConvId) {
            updateConversationTitle(qc, evt.convId, truncateTitle(evt.message.content))
          }
          break
        }

        case "streamStart":
          transitionToStreaming(qc, evt.convId)
          break

        case "streamChunk":
          appendStreamChunk(qc, evt.convId, evt.chunk)
          break

        case "streamEnd":
          finalizeStream(qc, evt.convId, evt.message)
          break

        case "stopped":
          stopStream(qc, evt.convId)
          break

        case "deleted":
          removeConversation(qc, evt.convId)
          break

        case "usageUpdate":
          updateUsage(qc, evt.remaining)
          break

        case "clear":
          qc.clear()
          break
      }
    }

    ch.addEventListener("message", handler)
    return () => ch.removeEventListener("message", handler)
  }, [qc])
}
