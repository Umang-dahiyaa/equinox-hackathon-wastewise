import { useMemo } from "react"
import { istDate } from "@/lib/dates"
import { levelFor, nextLevelText } from "@/lib/levels"
import { currentStreak, weeklyPointsNow } from "@/lib/points"
import { useApp } from "@/state/AppContext"

/** Every number here comes from real history / the stored profile. */
export function useStats() {
  const { history, profile } = useApp()
  return useMemo(() => {
    const today = istDate()
    const itemsToday = history.filter((h) => istDate(new Date(h.timestamp)) === today).length
    const points = profile?.points ?? 0
    const byCategory: Record<string, number> = {}
    history.forEach((h) => {
      const k = h.category_id ?? "none"
      byCategory[k] = (byCategory[k] ?? 0) + 1
    })
    return {
      itemsToday,
      streak: currentStreak(profile),
      totalSorted: Math.max(profile?.totalScans ?? 0, history.length),
      points,
      weeklyPoints: weeklyPointsNow(profile),
      corrections: profile?.corrections ?? history.filter((h) => h.corrected_item).length,
      level: levelFor(points),
      nextText: nextLevelText(points),
      byCategory,
      hasActivity: history.length > 0 || points > 0,
    }
  }, [history, profile])
}
