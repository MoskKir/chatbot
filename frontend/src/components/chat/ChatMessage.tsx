import { memo, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { cn } from "@/lib/utils"
import { STREAMING_ID } from "@/lib/cache"
import { ImageLightbox } from "./ImageLightbox"
import type { Message } from "@/types"

interface ChatMessageProps {
  message: Message
}

const markdownClasses = [
  "prose prose-sm dark:prose-invert max-w-none",
  "prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5",
  "prose-pre:my-2 prose-pre:rounded-xl prose-pre:bg-black/30 prose-pre:p-2 sm:prose-pre:p-3",
  "prose-code:before:content-none prose-code:after:content-none",
  "prose-code:rounded prose-code:bg-black/15 prose-code:px-1 prose-code:py-0.5 prose-code:text-[12px] sm:prose-code:text-[13px]",
  "prose-pre:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_pre]:max-w-full [&_code]:break-words",
  "prose-headings:my-2 prose-headings:font-semibold",
  "prose-a:text-blue-400 prose-a:underline",
  "prose-blockquote:border-l-2 prose-blockquote:border-muted-foreground/30 prose-blockquote:pl-3 prose-blockquote:my-2 prose-blockquote:italic",
  "[&_table]:block [&_table]:overflow-x-auto [&_table]:my-2",
  "prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1 sm:prose-th:px-3 sm:prose-td:px-3",
  "prose-th:border-b prose-td:border-b prose-th:border-border prose-td:border-border",
  "prose-th:text-xs prose-td:text-xs sm:prose-th:text-sm sm:prose-td:text-sm prose-th:whitespace-nowrap prose-td:whitespace-nowrap",
].join(" ")

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"
  const isStreaming = message.id === STREAMING_ID
  const [lightboxSrc, setLightboxSrc] = useState<{ src: string; name: string } | null>(null)

  return (
    <>
      <div className={cn(
        "flex px-2 sm:px-4 py-2 sm:py-3 max-w-3xl mx-auto w-full",
        !isStreaming && "animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser && "justify-end"
      )}>
        <div className={cn(
          "rounded-2xl max-w-[90%] sm:max-w-[85%] min-w-0 overflow-hidden",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}>
          {/* Images */}
          {message.images && message.images.length > 0 && (
            <div className={cn(
              "flex flex-wrap gap-1 p-1",
              message.images.length === 1 && "p-0"
            )}>
              {message.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxSrc(img)}
                  className={cn(
                    "block overflow-hidden transition-opacity hover:opacity-90",
                    message.images!.length === 1
                      ? "rounded-t-2xl w-full max-h-64"
                      : "rounded-lg w-20 h-20 sm:w-24 sm:h-24"
                  )}
                >
                  <img
                    src={img.src}
                    alt={img.name}
                    className={cn(
                      "object-cover",
                      message.images!.length === 1
                        ? "w-full max-h-64"
                        : "w-full h-full"
                    )}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Attached files */}
          {message.files && message.files.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 pt-2">
              {message.files.map((f) => (
                <span
                  key={f.id}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs",
                    isUser ? "bg-white/15" : "bg-black/10 dark:bg-white/10"
                  )}
                >
                  <span>📎</span>
                  <span className="truncate max-w-[160px]">{f.filename}</span>
                </span>
              ))}
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <div className={cn(
              "px-3 sm:px-4 py-2 sm:py-2.5 text-[13px] sm:text-sm leading-relaxed",
              !isStreaming && !isUser && markdownClasses
            )}>
              {isStreaming ? (
                <span className="whitespace-pre-wrap">{message.content}</span>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          )}
        </div>
      </div>

      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc.src}
          alt={lightboxSrc.name}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  )
})
