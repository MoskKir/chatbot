import { X } from "lucide-react"
import { Button } from "./button"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  maxWidth?: string
  children: React.ReactNode
}

export function Modal({
  open,
  onClose,
  title,
  maxWidth = "max-w-sm",
  children,
}: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className={`relative bg-card border border-border rounded-2xl shadow-2xl w-full ${maxWidth} mx-4 p-6 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300`}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 hover:rotate-90 transition-transform duration-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
