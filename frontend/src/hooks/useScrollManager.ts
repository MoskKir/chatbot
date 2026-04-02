import { useRef, useState, useCallback } from "react"

export function useScrollManager() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const scrollToBottom = useCallback((force = false, smooth = false) => {
    const el = containerRef.current
    if (!el) return
    if (force || isNearBottomRef.current) {
      if (smooth) {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
      } else {
        el.scrollTop = el.scrollHeight
      }
    }
  }, [])

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    isNearBottomRef.current = near
    setShowScrollBtn(!near)
  }, [])

  return { containerRef, showScrollBtn, setShowScrollBtn, scrollToBottom, handleScroll }
}
