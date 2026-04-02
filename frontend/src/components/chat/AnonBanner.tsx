import type { AuthUser, UsageInfo } from "@/types"

interface AnonBannerProps {
  user: AuthUser | null
  usage: UsageInfo | undefined
  onSignIn: () => void
}

export function AnonBanner({ user, usage, onSignIn }: AnonBannerProps) {
  if (user || !usage || usage.remaining === null || usage.remaining > 0) {
    return null
  }

  return (
    <div className="bg-muted border-b border-border px-4 py-3 text-center animate-in fade-in slide-in-from-top-2 duration-300">
      <p className="text-sm">
        You've used all {usage.limit} free messages.{" "}
        <button
          onClick={onSignIn}
          className="underline font-medium hover:text-foreground"
        >
          Sign in
        </button>{" "}
        for unlimited access.
      </p>
    </div>
  )
}
