// Light / dark theme. Light is the default; the choice is remembered on this device.
// app.html applies the saved theme before the first paint, so there's no flash.

import { useSyncExternalStore } from "react"

export type Theme = "light" | "dark"

const KEY = "wastewise.theme.v1"
const PAGE_COLOR: Record<Theme, string> = { light: "#F5F8EF", dark: "#0C130F" }

export function savedTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === "dark" ? "dark" : "light"
  } catch {
    return "light"
  }
}

const listeners = new Set<() => void>()
let current: Theme = typeof document !== "undefined" && document.documentElement.dataset.theme === "dark" ? "dark" : savedTheme()

function apply(theme: Theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", PAGE_COLOR[theme])
}

export function setTheme(theme: Theme) {
  current = theme
  apply(theme)
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* storage blocked: still switches for this visit */
  }
  listeners.forEach((l) => l())
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => current,
    () => "light" as Theme
  )
  return [theme, setTheme]
}
