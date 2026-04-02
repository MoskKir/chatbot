import { forwardRef } from "react"
import { ChatMessage } from "./ChatMessage"
import { EmptyState } from "./EmptyState"
import { TypingIndicator } from "./TypingIndicator"
import type { Message } from "@/types"

interface ChatMessageListProps {
  messages: (Message | "thinking")[]
  onSuggestion: (text: string) => void
  onScroll: () => void
}

export const ChatMessageList = forwardRef<HTMLDivElement, ChatMessageListProps>(
  function ChatMessageList({ messages, onSuggestion, onScroll }, ref) {
    if (messages.length === 0) {
      return (
        <div ref={ref} onScroll={onScroll} className="flex-1 overflow-y-auto">
          <EmptyState onSuggestion={onSuggestion} />
        </div>
      )
    }

    return (
      <div ref={ref} onScroll={onScroll} className="flex-1 overflow-y-auto">
        <div className="pb-4">
          {messages.map((item) =>
            item === "thinking" ? (
              <TypingIndicator key="__thinking__" />
            ) : (
              <ChatMessage key={item.id} message={item} />
            ),
          )}
        </div>
      </div>
    )
  },
)
