import { useState, useEffect, useRef, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, Search } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { modelDisplayName } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  model: string
  onModelChange: (model: string) => void
}

const FALLBACK_MODELS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-sonnet-4",
  "anthropic/claude-haiku-4",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "meta-llama/llama-4-maverick",
  "deepseek/deepseek-chat-v3-0324",
  "mistralai/mistral-medium-3",
]

export function SettingsModal({ open, onClose, model, onModelChange }: SettingsModalProps) {
  const [search, setSearch] = useState("")
  const [selectedModel, setSelectedModel] = useState(model)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [highlightIndex, setHighlightIndex] = useState(-1)

  const { data: settings } = useQuery({
    queryKey: ["model-settings"],
    queryFn: () => api.getModelSettings(),
    staleTime: 5 * 60_000,
    enabled: open,
  })

  const models = settings?.allowed?.length ? settings.allowed : FALLBACK_MODELS

  useEffect(() => {
    if (open) {
      setSelectedModel(model)
      setSearch("")
      setHighlightIndex(-1)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, model])

  const filtered = useMemo(() => {
    if (!search.trim()) return models
    const q = search.toLowerCase()
    return models.filter(
      (m) =>
        m.toLowerCase().includes(q) ||
        modelDisplayName(m).toLowerCase().includes(q),
    )
  }, [search, models])

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlightIndex(-1)
  }, [filtered])

  const selectModel = (m: string) => {
    setSelectedModel(m)
    setSearch("")
    inputRef.current?.focus()
  }

  const handleSave = () => {
    onModelChange(selectedModel.trim() || model)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (highlightIndex >= 0 && filtered[highlightIndex]) {
        selectModel(filtered[highlightIndex])
      } else {
        handleSave()
      }
    } else if (e.key === "Escape") {
      onClose()
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return
    const el = listRef.current.children[highlightIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: "nearest" })
  }, [highlightIndex])

  const provider = (m: string) => m.split("/")[0] ?? ""

  // Group models by provider for quick select
  const grouped = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const m of models) {
      const p = provider(m)
      if (!map.has(p)) map.set(p, [])
      map.get(p)!.push(m)
    }
    return map
  }, [models])

  return (
    <Modal open={open} onClose={onClose} title="Model" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Search / autocomplete input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search models..."
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow duration-200"
          />
        </div>

        {/* Current selection */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-muted-foreground">Selected:</span>
          <span className="text-sm font-medium truncate">{modelDisplayName(selectedModel)}</span>
          <span className="text-[10px] text-muted-foreground truncate">({provider(selectedModel)})</span>
        </div>

        {/* Model list (filtered or grouped) */}
        {search.trim() ? (
          // Filtered autocomplete list
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto rounded-lg border border-border divide-y divide-border"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No models match "{search}"
              </div>
            ) : (
              filtered.map((m, i) => (
                <button
                  key={m}
                  onClick={() => selectModel(m)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors",
                    i === highlightIndex && "bg-accent",
                    selectedModel === m ? "text-foreground font-medium" : "text-foreground/80 hover:bg-accent",
                  )}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{modelDisplayName(m)}</span>
                    <span className="text-[11px] text-muted-foreground truncate">{m}</span>
                  </div>
                  {selectedModel === m && (
                    <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
                  )}
                </button>
              ))
            )}
          </div>
        ) : (
          // Quick select grouped by provider
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {[...grouped.entries()].map(([prov, provModels]) => (
              <div key={prov}>
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-0.5">
                  {prov}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {provModels.map((m) => (
                    <button
                      key={m}
                      onClick={() => selectModel(m)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs border transition-all duration-150 active:scale-95",
                        selectedModel === m
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted border-border hover:bg-accent text-foreground hover:scale-105",
                      )}
                    >
                      {modelDisplayName(m)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          Models from{" "}
          <a
            href="https://openrouter.ai/models"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            openrouter.ai/models
          </a>
        </p>
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <Button variant="ghost" onClick={onClose} className="hover:scale-105 active:scale-95 transition-transform">
          Cancel
        </Button>
        <Button onClick={handleSave} className="hover:scale-105 active:scale-95 transition-transform">
          Save
        </Button>
      </div>
    </Modal>
  )
}
