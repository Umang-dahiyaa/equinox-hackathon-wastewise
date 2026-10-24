// Opt-in scan locations for the footprint globe. Off by default; locations are rounded
// to about 100 m and kept with the scan history on this device only.

import { useCallback, useState } from "react"

const KEY = "wastewise.recordScanLocation.v1"

export interface LatLng {
  lat: number
  lng: number
}

export function recordLocationEnabled() {
  try {
    return localStorage.getItem(KEY) === "1"
  } catch {
    return false
  }
}

function setRecordLocation(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "1" : "0")
  } catch {
    /* ignore */
  }
}

/** Current position (rounded), or null if unavailable, refused or too slow. */
export function currentLocation(timeoutMs = 8000): Promise<LatLng | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null)
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs + 500)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer)
        resolve({ lat: Math.round(pos.coords.latitude * 1000) / 1000, lng: Math.round(pos.coords.longitude * 1000) / 1000 })
      },
      () => {
        clearTimeout(timer)
        resolve(null)
      },
      { enableHighAccuracy: false, maximumAge: 120_000, timeout: timeoutMs }
    )
  })
}

/** Where a scan is being saved, if the user turned location on. Never holds the save up for long. */
export function scanLocation() {
  return recordLocationEnabled() ? currentLocation(4000) : Promise.resolve(null)
}

/** The "Record where I scan" switch: turning it on asks the browser for permission first. */
export function useRecordLocation() {
  const [enabled, setEnabled] = useState(recordLocationEnabled)
  const [asking, setAsking] = useState(false)
  const set = useCallback(async (on: boolean) => {
    if (!on) {
      setRecordLocation(false)
      setEnabled(false)
      return true
    }
    setAsking(true)
    const here = await currentLocation()
    setAsking(false)
    if (!here) return false
    setRecordLocation(true)
    setEnabled(true)
    return true
  }, [])
  return { enabled, asking, set }
}
