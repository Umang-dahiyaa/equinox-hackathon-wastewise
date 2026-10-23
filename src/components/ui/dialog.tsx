import { useEffect, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  title: string
  body: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onCancel, danger }: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onCancel])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center px-6">
      <div className="ww-fade absolute inset-0 bg-ink/30" onClick={onCancel} aria-hidden="true" />
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="sky-sheet ww-pop relative w-full max-w-[360px] rounded-[22px] border border-green/12 p-6 shadow-lift">
        <h2 id="confirm-title" className="display text-2xl">{title}</h2>
        <div className="mt-2 text-sm text-sub">{body}</div>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button className={danger ? "flex-1 bg-cat-hazardous text-white hover:bg-cat-hazardous/90" : "flex-1"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
