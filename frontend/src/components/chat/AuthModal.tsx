import { useState } from "react"
import { toast } from "sonner"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"

/** Map server error messages to safe user-facing messages */
function sanitizeAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes("invalid login") || lower.includes("invalid credentials"))
    return "Invalid email or password."
  if (lower.includes("already registered") || lower.includes("already exists"))
    return "An account with this email already exists."
  if (lower.includes("rate limit") || lower.includes("too many"))
    return "Too many attempts. Please try again later."
  if (lower.includes("email"))
    return "Please check your email address."
  if (lower.includes("password"))
    return "Password does not meet requirements."
  return "Something went wrong. Please try again."
}

interface AuthModalProps {
  open: boolean
  onClose: () => void
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string) => Promise<void>
}

export function AuthModal({ open, onClose, onSignIn, onSignUp }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")

  const resetFeedback = () => { setError(""); setSuccess("") }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    resetFeedback()
    setLoading(true)
    try {
      if (mode === "login") {
        await onSignIn(email, password)
        onClose()
      } else {
        await onSignUp(email, password)
        setSuccess("Check your email to confirm your account.")
      }
    } catch (err: any) {
      const safeMsg = sanitizeAuthError(err.message || "")
      setError(safeMsg)
      toast.error(safeMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={mode === "login" ? "Sign In" : "Create Account"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow duration-200"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow duration-200"
            placeholder="Min 6 characters"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2 animate-in fade-in shake duration-300">{error}</p>
        )}
        {success && (
          <p className="text-xs text-emerald-500 bg-emerald-500/10 rounded-lg px-3 py-2 animate-in fade-in duration-300">{success}</p>
        )}

        <Button type="submit" className="w-full hover:scale-[1.02] active:scale-[0.98] transition-transform" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Loading...
            </span>
          ) : mode === "login" ? "Sign In" : "Sign Up"}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground text-center mt-4">
        {mode === "login" ? (
          <>
            No account?{" "}
            <button
              onClick={() => { setMode("register"); resetFeedback() }}
              className="underline hover:text-foreground transition-colors"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => { setMode("login"); resetFeedback() }}
              className="underline hover:text-foreground transition-colors"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </Modal>
  )
}
