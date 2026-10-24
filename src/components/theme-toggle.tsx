import { Moon, Sun } from "lucide-react"
import { useTheme, type Theme } from "@/lib/theme"
import { cn } from "@/lib/utils"

/** Round sun/moon button for the headers. */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useTheme()
  const dark = theme === "dark"
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light theme" : "Dark theme"}
      className={cn("ww-press pill-glass grid h-11 w-11 shrink-0 place-items-center text-ink", className)}
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  )
}

/** Light / Dark segmented control for Profile settings. */
export function ThemeChoice() {
  const [theme, setTheme] = useTheme()
  const options: { id: Theme; label: string; icon: typeof Sun }[] = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
  ]
  return (
    <div role="radiogroup" aria-label="Theme" className="tile inline-flex gap-1 p-1">
      {options.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          role="radio"
          aria-checked={theme === id}
          onClick={() => setTheme(id)}
          className={cn(
            "ww-press inline-flex h-10 items-center gap-1.5 rounded-[12px] px-4 text-sm font-semibold transition-colors",
            theme === id ? "bg-card text-ink shadow-soft" : "text-sub"
          )}
        >
          <Icon size={16} /> {label}
        </button>
      ))}
    </div>
  )
}
