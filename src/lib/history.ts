import type { HistoryEntry } from "@/lib/types"

const KEY = "wastewise.history.v1"
const MAX_ENTRIES = 300

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? (JSON.parse(raw) as HistoryEntry[]) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function saveHistory(list: HistoryEntry[]) {
  let trimmed = list.slice(0, MAX_ENTRIES)
  // If storage is full, drop the oldest entries' thumbnails, then the entries.
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      localStorage.setItem(KEY, JSON.stringify(trimmed))
      return
    } catch {
      trimmed = trimmed.slice(0, Math.max(20, Math.floor(trimmed.length * 0.7)))
    }
  }
}
