import {
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon,
  Settings,
  LogIn,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { modelDisplayName } from "@/lib/utils"
import type { AuthUser } from "@/types"

interface ChatHeaderProps {
  title: string
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onOpenSettings: () => void
  onOpenAuth: () => void
  onSignOut: () => void
  toggleTheme: () => void
  dark: boolean
  user: AuthUser | null
  model: string
  usage: { remaining: number | null; limit: number | null } | null
}

export function ChatHeader({
  title,
  sidebarOpen,
  onToggleSidebar,
  onOpenSettings,
  onOpenAuth,
  onSignOut,
  toggleTheme,
  dark,
  user,
  model,
  usage,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 h-11 sm:h-12 border-b border-border shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="h-8 w-8 shrink-0"
      >
        {sidebarOpen ? (
          <PanelLeftClose className="h-4 w-4" />
        ) : (
          <PanelLeft className="h-4 w-4" />
        )}
      </Button>
      <span className="text-sm font-medium truncate flex-1 min-w-0">
        {title}
      </span>
      {!user && usage && usage.remaining !== null && (
        <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
          {usage.remaining}/{usage.limit}
        </span>
      )}
      <span className="text-xs text-muted-foreground hidden md:block shrink-0">
        {modelDisplayName(model)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenSettings}
        className="h-8 w-8 shrink-0"
      >
        <Settings className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="h-8 w-8 shrink-0 hidden sm:flex"
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      {user ? (
        <div className="flex items-center gap-0.5 shrink-0">
          <span className="text-xs text-muted-foreground hidden lg:block truncate max-w-[120px]">
            {user.email}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSignOut}
            className="h-8 w-8"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenAuth}
          className="h-8 w-8 shrink-0"
          title="Sign in"
        >
          <LogIn className="h-4 w-4" />
        </Button>
      )}
    </header>
  )
}
