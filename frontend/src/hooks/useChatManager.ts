import { useState, useRef, useEffect, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "./useAuth"
import { useSocket } from "./useSocket"
import { useTheme } from "./useTheme"
import { useScrollManager } from "./useScrollManager"
import { useConversationList } from "./useConversationList"
import { useConversationMessages } from "./useConversationMessages"
import { useUsage } from "./useUsage"
import { useSocketEvents } from "./useSocketEvents"
import { useSendMessage } from "./useSendMessage"
import { useTabSync } from "./useTabSync"
import { useUIState } from "./useUIState"
import { useVisibleMessages } from "./useVisibleMessages"
import { useChatActions } from "./useChatActions"
import { useAuthCacheSync } from "./useAuthCacheSync"
import { THINKING_ID, STREAMING_ID } from "@/lib/cache"

export function useChatManager() {
  const qc = useQueryClient()
  const { user, signIn, signUp, signOut, token } = useAuth()
  const { socketRef, version: socketVersion } = useSocket(token)
  const { dark, toggle: toggleTheme } = useTheme()
  const scroll = useScrollManager()
  useTabSync()

  const ui = useUIState()

  // Active conversation
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeIdRef = useRef(activeId)
  activeIdRef.current = activeId

  // Data
  const { data: conversations = [] } = useConversationList()
  const { data: messages = [] } = useConversationMessages(activeId)
  const { data: usage } = useUsage()

  const activeTitle = conversations.find((c) => c.id === activeId)?.title ?? "ChatBot"
  const isBusy = messages.some((m) => m.id === THINKING_ID || m.id === STREAMING_ID)
  const visibleMessages = useVisibleMessages(messages)

  // Effects
  const resetActiveId = useCallback(() => setActiveId(null), [])
  useAuthCacheSync(user?.id, qc, resetActiveId)

  const lastMsg = messages.at(-1)
  useEffect(() => {
    scroll.scrollToBottom()
  }, [messages.length, lastMsg?.content, scroll.scrollToBottom])

  // Socket events
  useSocketEvents({ socketRef, socketVersion, activeIdRef, setActiveId, setAuthOpen: ui.setAuthOpen })

  // Send
  const handleSend = useSendMessage({
    activeId, model: ui.model, isBusy, socketRef, user, usage,
    setActiveId, setAuthOpen: ui.setAuthOpen, scrollToBottom: scroll.scrollToBottom,
  })

  // Actions
  const actions = useChatActions({
    activeId, activeIdRef, socketRef, setActiveId, signOut,
  })

  return {
    user, signIn, signUp,
    dark, toggleTheme,
    ...ui,
    conversations, activeId, activeTitle,
    visibleMessages, isBusy,
    ...actions,
    handleSend,
    usage,
    ...scroll,
  }
}
