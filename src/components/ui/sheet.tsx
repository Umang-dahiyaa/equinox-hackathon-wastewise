import { useEffect, type ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  /** full-height on phones, 400px side panel on desktop */
  panel?: boolean
  className?: string
  labelledBy?: string
}

export function Sheet({ open, onClose, title, children, panel, className, labelledBy }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="ww-fade absolute inset-0 bg-ink/30 backdrop-blur-[3px]" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          "sky-sheet ww-sheet absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] w-full max-w-[480px] flex-col rounded-t-[28px] shadow-lift",
          // laptops: a centred dialog instead of a bottom sheet
          !panel && "lg:inset-y-0 lg:my-auto lg:h-fit lg:max-w-[540px] lg:rounded-[28px]",
          panel && "h-[100dvh] max-h-[100dvh] rounded-t-[28px] ww-panel md:inset-y-0 md:right-0 md:left-auto md:mx-0 md:h-full md:max-h-full md:w-[400px] md:rounded-none md:rounded-l-[28px]",
          className
        )}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <h2 id={labelledBy} className="display text-2xl">{title}</h2>
            <button onClick={onClose} className="ww-press pill-glass grid h-11 w-11 place-items-center" aria-label="Close">
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
