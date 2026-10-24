import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export function Chip({ active, className, type = "button", ...props }: ChipProps) {
  return (
    <button
      type={type}
      className={cn(
        "ww-press inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors",
        active ? "border-green bg-green text-white" : "border-green/15 bg-card text-ink hover:bg-mint/60",
        className
      )}
      {...props}
    />
  )
}
