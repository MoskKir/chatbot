export function TypingIndicator() {
  return (
    <div className="flex px-2 sm:px-4 py-2 sm:py-3 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex gap-1.5 items-center h-8 rounded-2xl bg-muted px-4">
        <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  )
}
