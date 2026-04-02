import { MessageSquarePlus, Trash2, MessageSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/types"

interface SidebarProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  open: boolean
  onClose: () => void
}

export function Sidebar({ conversations, activeId, onSelect, onNew, onDelete, open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0",
          // Mobile: fixed overlay
          "fixed z-40 md:relative",
          open ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        <div className="p-3 flex items-center gap-2">
          <Button
            onClick={onNew}
            variant="outline"
            className="flex-1 justify-start gap-2 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New chat
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 md:hidden text-sidebar-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          <div className="flex flex-col gap-0.5 pb-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  onSelect(conv.id)
                  if (window.innerWidth < 768) onClose()
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSelect(conv.id)
                    if (window.innerWidth < 768) onClose()
                  }
                }}
                className={cn(
                  "group flex items-center gap-1.5 rounded-lg pl-3 pr-1.5 py-2.5 text-sm text-left transition-colors w-full cursor-pointer",
                  "hover:bg-sidebar-accent text-sidebar-foreground",
                  activeId === conv.id && "bg-sidebar-accent"
                )}
              >
                <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
                <span className="truncate flex-1 min-w-0">{conv.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(conv.id)
                  }}
                  className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 md:opacity-0 md:group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
            ChatBot
          </div>
        </div>
      </aside>
    </>
  )
}
