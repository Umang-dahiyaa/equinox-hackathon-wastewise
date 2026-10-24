import { useEffect, useState } from "react"
import type { DumpReport, DumpSeverity } from "@/dumps/types"

/** Pin colours for dump severity, matching the heatmap's gradient (green → red). */
export const SEVERITY_COLOR: Record<DumpSeverity, string> = {
  critical: "#FF4136",
  high: "#FF8A00",
  medium: "#F5B400",
  low: "#22C55E",
}

export const SEVERITY_ORDER: DumpSeverity[] = ["critical", "high", "medium", "low"]

/** Dumps that still need clearing, loaded once from the server. */
export function useActiveDumps() {
  const [dumps, setDumps] = useState<DumpReport[]>([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    let alive = true
    fetch("/api/dumps")
      .then((r) => r.json())
      .then((d) => alive && setDumps((d.dumps as DumpReport[] | undefined)?.filter((x) => x.status !== "cleaned") ?? []))
      .catch(() => {})
      .finally(() => alive && setLoaded(true))
    return () => {
      alive = false
    }
  }, [])
  return { dumps, loaded }
}
