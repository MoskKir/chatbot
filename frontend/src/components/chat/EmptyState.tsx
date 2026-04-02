import { Sparkles, Code, Lightbulb, Globe } from "lucide-react"

interface EmptyStateProps {
  onSuggestion: (text: string) => void
}

const suggestions = [
  { icon: Lightbulb, text: "Explain quantum computing in simple terms" },
  { icon: Code, text: "Write a Python script to sort a list" },
  { icon: Sparkles, text: "What are the best practices for React?" },
  { icon: Globe, text: "Help me plan a weekend trip" },
]

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full px-4 animate-in fade-in duration-500">
      <div className="flex flex-col items-center max-w-xl w-full">
        <h1 className="text-2xl sm:text-3xl font-semibold text-center animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
          What can I help with?
        </h1>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full mt-8 sm:mt-10">
          {suggestions.map((s, i) => (
            <button
              key={s.text}
              onClick={() => onSuggestion(s.text)}
              className="flex flex-col items-center text-center gap-2 sm:gap-3 rounded-2xl border border-border px-3 py-4 sm:px-4 sm:py-5 text-xs sm:text-sm hover:bg-accent hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${200 + i * 75}ms`, animationFillMode: "both" }}
            >
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <span className="leading-snug">{s.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
