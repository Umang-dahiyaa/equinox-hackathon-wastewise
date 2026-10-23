import { cn } from "@/lib/utils"

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-8 w-14 shrink-0 rounded-full transition-colors", checked ? "bg-green" : "bg-mint")}
    >
      <span className={cn("absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform", checked && "translate-x-6")} />
    </button>
  )
}
