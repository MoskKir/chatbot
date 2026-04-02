import { useMemo } from "react"
import { THINKING_ID, STREAMING_ID } from "@/lib/cache"
import type { Message } from "@/types"

export function useVisibleMessages(messages: Message[]): (Message | "thinking")[] {
  return useMemo(() => {
    const result: (Message | "thinking")[] = []
    for (const m of messages) {
      if (m.id === THINKING_ID || (m.id === STREAMING_ID && m.content.length === 0)) {
        result.push("thinking")
      } else {
        result.push(m)
      }
    }
    return result
  }, [messages])
}
