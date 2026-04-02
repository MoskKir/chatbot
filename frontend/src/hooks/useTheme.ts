import { useState, useLayoutEffect } from "react"

export function useTheme() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("theme")
    return stored ? stored === "dark" : true
  })

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    localStorage.setItem("theme", dark ? "dark" : "light")
  }, [dark])

  const toggle = () => setDark((d) => !d)

  return { dark, toggle }
}
