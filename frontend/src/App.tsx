import { Toaster } from "sonner"
import { Sidebar } from "@/components/chat/Sidebar"
import { ChatHeader } from "@/components/chat/ChatHeader"
import { ChatMessageList } from "@/components/chat/ChatMessageList"
import { ChatInput } from "@/components/chat/ChatInput"
import { AnonBanner } from "@/components/chat/AnonBanner"
import { ScrollToBottomButton } from "@/components/chat/ScrollToBottomButton"
import { SettingsModal } from "@/components/chat/SettingsModal"
import { AuthModal } from "@/components/chat/AuthModal"
import { useChatManager } from "@/hooks/useChatManager"

function App() {
  const cm = useChatManager()

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        conversations={cm.conversations}
        activeId={cm.activeId}
        onSelect={cm.handleSelect}
        onNew={cm.handleNew}
        onDelete={cm.handleDelete}
        open={cm.sidebarOpen}
        onClose={() => cm.setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <ChatHeader
          title={cm.activeTitle}
          sidebarOpen={cm.sidebarOpen}
          onToggleSidebar={() => cm.setSidebarOpen(!cm.sidebarOpen)}
          onOpenSettings={() => cm.setSettingsOpen(true)}
          onOpenAuth={() => cm.setAuthOpen(true)}
          onSignOut={cm.handleSignOut}
          toggleTheme={cm.toggleTheme}
          dark={cm.dark}
          user={cm.user}
          model={cm.model}
          usage={cm.usage ?? null}
        />

        <AnonBanner
          user={cm.user}
          usage={cm.usage}
          onSignIn={() => cm.setAuthOpen(true)}
        />

        <ChatMessageList
          ref={cm.containerRef}
          messages={cm.visibleMessages}
          onSuggestion={cm.handleSend}
          onScroll={cm.handleScroll}
        />

        {cm.showScrollBtn && (
          <ScrollToBottomButton
            onClick={() => {
              cm.scrollToBottom(true, true)
              cm.setShowScrollBtn(false)
            }}
          />
        )}

        <ChatInput
          onSend={cm.handleSend}
          isLoading={cm.isBusy}
          onStop={cm.handleStop}
        />
      </div>

      <SettingsModal
        open={cm.settingsOpen}
        onClose={() => cm.setSettingsOpen(false)}
        model={cm.model}
        onModelChange={cm.handleModelChange}
      />
      <AuthModal
        open={cm.authOpen}
        onClose={() => cm.setAuthOpen(false)}
        onSignIn={cm.signIn}
        onSignUp={cm.signUp}
      />
      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}

export default App
