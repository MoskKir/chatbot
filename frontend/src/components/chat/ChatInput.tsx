import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { ArrowUp, Square, Paperclip, X, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_MESSAGE_LENGTH = 32_000

export interface AttachedFile {
  file: File
  uploading: boolean
  error?: string
}

interface ChatInputProps {
  onSend: (message: string, files: File[]) => void
  isLoading: boolean
  onStop: () => void
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ACCEPT = ".txt,.md,.csv,.json,.pdf,.docx,.png,.jpg,.jpeg,.gif,.webp"

export function ChatInput({ onSend, isLoading, onStop }: ChatInputProps) {
  const [input, setInput] = useState("")
  const [focused, setFocused] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim()
    if ((!trimmed && files.length === 0) || isLoading) return
    onSend(trimmed || `[Uploaded ${files.length} file(s)]`, files)
    setInput("")
    // Revoke all Object URLs for submitted files
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    objectUrlsRef.current.clear()
    setFiles([])
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [input, files, isLoading, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 200) + "px"
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    const valid: File[] = []
    for (const file of selected) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds 10MB limit.`)
      } else {
        valid.push(file)
      }
    }
    if (valid.length > 0) {
      setFiles((prev) => [...prev, ...valid])
    }
    e.target.value = ""
  }

  // Track Object URLs so we can revoke them to prevent memory leaks
  const objectUrlsRef = useRef<Map<File, string>>(new Map())

  const getObjectUrl = useCallback((file: File) => {
    const existing = objectUrlsRef.current.get(file)
    if (existing) return existing
    const url = URL.createObjectURL(file)
    objectUrlsRef.current.set(file, url)
    return url
  }, [])

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const removed = prev[index]
      if (removed) {
        const url = objectUrlsRef.current.get(removed)
        if (url) {
          URL.revokeObjectURL(url)
          objectUrlsRef.current.delete(removed)
        }
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  // Revoke all Object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrlsRef.current.clear()
    }
  }, [])

  const hasContent = input.trim().length > 0 || files.length > 0

  return (
    <div className="bg-background px-2 sm:px-4 pt-2 pb-3 sm:pb-4">
      <div className="max-w-3xl mx-auto">
        <div
          className={cn(
            "relative rounded-2xl sm:rounded-3xl border bg-card transition-shadow duration-200",
            focused ? "border-border shadow-lg shadow-black/5 dark:shadow-black/20" : "border-border/60"
          )}
        >
          {/* Attached files */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 sm:px-4 pt-3">
              {files.map((file, i) => {
                const isImage = file.type.startsWith("image/")
                return (
                  <div
                    key={`${file.name}-${i}`}
                    className="relative group animate-in fade-in zoom-in-95 duration-200"
                  >
                    {isImage ? (
                      <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={getObjectUrl(file)}
                          alt={file.name}
                          className="h-full w-full object-cover"
                        />
                        <button
                          onClick={() => removeFile(i)}
                          className="absolute top-0.5 right-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1.5 text-xs">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[120px] sm:max-w-[180px]">{file.name}</span>
                        <span className="text-muted-foreground shrink-0">{formatSize(file.size)}</span>
                        <button
                          onClick={() => removeFile(i)}
                          className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="px-3 sm:px-4 pt-3 sm:pt-3.5 pb-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={files.length > 0 ? "Ask about your files..." : "Message ChatBot..."}
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH}
              className="w-full resize-none bg-transparent text-sm sm:text-[15px] leading-relaxed placeholder:text-muted-foreground/70 focus:outline-none max-h-[200px]"
            />
          </div>

          <div className="flex items-center justify-between px-2 sm:px-3 pb-2 sm:pb-2.5">
            <div className="flex items-center gap-0.5">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Attach file (txt, md, csv, json, pdf, docx)"
              >
                <Paperclip className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground/50 select-none hidden sm:block">
                Shift+Enter for new line
              </span>
              {isLoading ? (
                <button
                  onClick={onStop}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-muted hover:bg-muted-foreground/20 text-foreground transition-colors"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!hasContent}
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-full transition-all duration-150",
                    hasContent
                      ? "bg-foreground text-background hover:opacity-80 scale-100"
                      : "bg-muted text-muted-foreground cursor-not-allowed scale-95 opacity-50"
                  )}
                >
                  <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-[10px] sm:text-[11px] text-muted-foreground/50 text-center mt-1.5 sm:mt-2">
          ChatBot can make mistakes. Check important info.
        </p>
      </div>
    </div>
  )
}
