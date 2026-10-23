import { cn } from "@/lib/utils"

export function Progress({ value, className, barClassName, label }: { value: number; className?: string; barClassName?: string; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-mint", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={cn("h-full rounded-full bg-green transition-[width] duration-500", barClassName)} style={{ width: `${pct}%` }} />
    </div>
  )
}
