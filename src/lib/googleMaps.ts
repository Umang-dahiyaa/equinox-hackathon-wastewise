// Loads the Google Maps JavaScript API once, with the browser key from .env.local
// (VITE_GOOGLE_MAPS_API_KEY). Restrict that key to your site's URLs in Google Cloud.

import { useEffect, useState } from "react"

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
/** Advanced markers need a map ID; DEMO_MAP_ID works for development. */
export const MAP_ID = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined) || "DEMO_MAP_ID"
export const mapsAvailable = !!KEY

type Status = "loading" | "ready" | "error"
let status: Status = "loading"
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()
const notify = (s: Status) => {
  status = s
  listeners.forEach((l) => l())
}

declare global {
  interface Window {
    __wastewiseMapsReady?: () => void
    gm_authFailure?: () => void
  }
}

/** Loads the script (once) plus the maps and marker libraries. */
export function loadGoogleMaps(): Promise<void> {
  if (!KEY) return Promise.reject(new Error("VITE_GOOGLE_MAPS_API_KEY is not set"))
  if (loading) return loading
  loading = new Promise<void>((resolve, reject) => {
    // Google calls this if the key is invalid, not enabled for Maps, or not allowed on this URL
    window.gm_authFailure = () => {
      notify("error")
      reject(new Error("Google Maps rejected the API key"))
    }
    window.__wastewiseMapsReady = async () => {
      try {
        await Promise.all([google.maps.importLibrary("maps"), google.maps.importLibrary("marker")])
        notify("ready")
        resolve()
      } catch (err) {
        notify("error")
        reject(err)
      }
    }
    const s = document.createElement("script")
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&v=weekly&loading=async&callback=__wastewiseMapsReady`
    s.async = true
    s.onerror = () => {
      notify("error")
      reject(new Error("Couldn't load Google Maps"))
    }
    document.head.appendChild(s)
  })
  return loading
}

/** "ready" once Google Maps can be used; "error" if the key is missing or refused. */
export function useGoogleMaps(): Status {
  const [s, setS] = useState<Status>(KEY ? status : "error")
  useEffect(() => {
    if (!KEY) return
    const l = () => setS(status)
    listeners.add(l)
    loadGoogleMaps().catch(() => {})
    l()
    return () => {
      listeners.delete(l)
    }
  }, [])
  return s
}

/** A small HTML element to use as an advanced marker's content. */
export function pinElement(html: string, title?: string) {
  const el = document.createElement("div")
  el.innerHTML = html
  if (title) el.title = title
  return el
}
