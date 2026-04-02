import { ArrowDown } from "lucide-react"

interface ScrollToBottomButtonProps {
  onClick: () => void
}

export function ScrollToBottomButton({ onClick }: ScrollToBottomButtonProps) {
  return (
    <div className="flex justify-center -mt-6 relative z-10 pointer-events-none animate-in fade-in duration-200">
      <button
        onClick={onClick}
        className="pointer-events-auto flex items-center justify-center h-8 w-8 rounded-full border border-border bg-background shadow-md hover:bg-accent transition-colors"
      >
        <ArrowDown className="h-4 w-4" />
      </button>
    </div>
  )
}
