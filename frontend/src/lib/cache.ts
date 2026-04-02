import type { QueryClient } from "@tanstack/react-query"
import { CONVERSATIONS_KEY } from "@/hooks/useConversationList"
import { conversationKey } from "@/hooks/useConversationMessages"
import { USAGE_KEY } from "@/hooks/useUsage"
import type { Conversation, Message } from "@/types"

export const THINKING_ID = "__thinking__"
export const STREAMING_ID = "__streaming__"
export const TEMP_PREFIX = "__temp_"
export const PENDING_PREFIX = "__pending_"

export function toMessage(data: {
  id: string
  role: string
  content: string
  createdAt: string
}): Message {
  return {
    id: data.id,
    role: data.role as "user" | "assistant",
    content: data.content,
    timestamp: new Date(data.createdAt),
  }
}

export function replaceTempMessage(
  qc: QueryClient,
  convId: string,
  serverMsg: Message,
) {
  qc.setQueryData<Message[]>(conversationKey(convId), (old) =>
    old
      ? old.map((m) =>
          m.id.startsWith(TEMP_PREFIX)
            ? { ...serverMsg, images: m.images, files: m.files }
            : m,
        )
      : [serverMsg],
  )
}

export function swapPendingConversation(
  qc: QueryClient,
  pendingId: string,
  realId: string,
  serverMsg: Message,
) {
  const pendingMessages = qc.getQueryData<Message[]>(
    conversationKey(pendingId),
  )
  if (pendingMessages) {
    qc.setQueryData<Message[]>(
      conversationKey(realId),
      pendingMessages.map((m) =>
        m.id.startsWith(TEMP_PREFIX)
          ? { ...serverMsg, images: m.images, files: m.files }
          : m,
      ),
    )
    qc.removeQueries({ queryKey: conversationKey(pendingId) })
  }
  qc.setQueryData<Conversation[]>(CONVERSATIONS_KEY, (old) =>
    old
      ? old.map((c) => (c.id === pendingId ? { ...c, id: realId } : c))
      : [],
  )
}

export function addOptimisticMessages(
  qc: QueryClient,
  convId: string,
  userMsg: Message,
) {
  qc.setQueryData<Message[]>(conversationKey(convId), (old) => [
    ...(old ?? []),
    userMsg,
    {
      id: THINKING_ID,
      role: "assistant" as const,
      content: "",
      timestamp: new Date(),
    },
  ])
}

export function addConversation(qc: QueryClient, conv: Conversation) {
  qc.setQueryData<Conversation[]>(CONVERSATIONS_KEY, (old) => {
    const list = old ?? []
    if (list.some((c) => c.id === conv.id)) return list
    return [conv, ...list]
  })
}

export function updateConversationTitle(
  qc: QueryClient,
  convId: string,
  title: string,
) {
  qc.setQueryData<Conversation[]>(CONVERSATIONS_KEY, (old) =>
    old ? old.map((c) => (c.id === convId ? { ...c, title } : c)) : [],
  )
}

export function removeConversation(qc: QueryClient, convId: string) {
  qc.setQueryData<Conversation[]>(CONVERSATIONS_KEY, (old) =>
    old ? old.filter((c) => c.id !== convId) : [],
  )
  qc.removeQueries({ queryKey: conversationKey(convId) })
}

export function transitionToStreaming(qc: QueryClient, convId: string) {
  qc.setQueryData<Message[]>(conversationKey(convId), (old) =>
    old
      ? old.map((m) =>
          m.id === THINKING_ID ? { ...m, id: STREAMING_ID } : m,
        )
      : [],
  )
}

export function appendStreamChunk(
  qc: QueryClient,
  convId: string,
  chunk: string,
) {
  qc.setQueryData<Message[]>(conversationKey(convId), (old) =>
    old
      ? old.map((m) =>
          m.id === STREAMING_ID ? { ...m, content: m.content + chunk } : m,
        )
      : [],
  )
}

export function finalizeStream(
  qc: QueryClient,
  convId: string,
  finalMsg: Message,
) {
  qc.setQueryData<Message[]>(conversationKey(convId), (old) =>
    old ? old.map((m) => (m.id === STREAMING_ID ? finalMsg : m)) : [finalMsg],
  )
  qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
  qc.invalidateQueries({ queryKey: conversationKey(convId) })
}

export function stopStream(qc: QueryClient, convId: string) {
  qc.setQueryData<Message[]>(conversationKey(convId), (old) => {
    if (!old) return []
    return old
      .filter((m) => m.id !== THINKING_ID)
      .map((m) =>
        m.id === STREAMING_ID
          ? m.content
            ? { ...m, id: `stopped_${Date.now()}` }
            : null
          : m,
      )
      .filter(Boolean) as Message[]
  })
}

export function removeThinking(qc: QueryClient, convId: string) {
  qc.setQueryData<Message[]>(conversationKey(convId), (old) =>
    old ? old.filter((m) => m.id !== THINKING_ID) : [],
  )
}

export function updateUsage(qc: QueryClient, remaining: number) {
  qc.setQueryData(USAGE_KEY, (old: any) =>
    old ? { ...old, remaining } : old,
  )
}
