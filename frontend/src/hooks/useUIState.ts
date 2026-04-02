import { useState, useCallback } from "react"

export function useUIState() {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [model, setModel] = useState(
    () => localStorage.getItem("chatbot-model") || "openai/gpt-4o-mini",
  )

  const handleModelChange = useCallback((m: string) => {
    setModel(m)
    localStorage.setItem("chatbot-model", m)
  }, [])

  return {
    sidebarOpen, setSidebarOpen,
    settingsOpen, setSettingsOpen,
    authOpen, setAuthOpen,
    model, handleModelChange,
  }
}
