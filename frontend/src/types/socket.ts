import type { MutableRefObject } from "react"
import type { Socket } from "socket.io-client"
import type { Message } from "./chat"

export type SyncEvent =
  | { type: "userMessage"; convId: string; message: Message; title: string; isNew: boolean }
  | { type: "messageSaved"; convId: string; message: Message; prevConvId?: string }
  | { type: "streamStart"; convId: string }
  | { type: "streamChunk"; convId: string; chunk: string }
  | { type: "streamEnd"; convId: string; message: Message }
  | { type: "stopped"; convId: string }
  | { type: "deleted"; convId: string }
  | { type: "clear" }
  | { type: "usageUpdate"; remaining: number }

export interface UseSocketEventsOptions {
  socketRef: MutableRefObject<Socket | null>
  socketVersion: number
  activeIdRef: MutableRefObject<string | null>
  setActiveId: (id: string | null | ((prev: string | null) => string | null)) => void
  setAuthOpen: (open: boolean) => void
}

export interface UseSendMessageOptions {
  activeId: string | null
  model: string
  isBusy: boolean
  socketRef: MutableRefObject<Socket | null>
  user: { id: string; email: string } | null
  usage: { authenticated: boolean; remaining: number | null; limit: number | null } | undefined
  setActiveId: (id: string | null) => void
  setAuthOpen: (open: boolean) => void
  scrollToBottom: (force?: boolean) => void
}
