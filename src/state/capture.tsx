// One place that opens the camera or file picker and returns a prepared image,
// so Home, the Scan screen and the Lulu chat all behave the same.

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { Camera, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ImageError, prepareFromVideo, prepareImageFile } from "@/lib/image"
import { playShutterSound } from "@/lib/sound"
import type { ImageInput } from "@/lib/types"
import { useApp } from "@/state/AppContext"

export type CaptureMode = "camera" | "upload"

const Ctx = createContext<((mode: CaptureMode) => Promise<ImageInput | null>) | null>(null)

export function useCapture() {
  const v = useContext(Ctx)
  if (!v) throw new Error("useCapture must be used inside CaptureProvider")
  return v
}

const isTouchDevice = () => typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches

export function CaptureProvider({ children }: { children: ReactNode }) {
  const { toast } = useApp()
  const cameraInput = useRef<HTMLInputElement>(null)
  const uploadInput = useRef<HTMLInputElement>(null)
  const resolver = useRef<((v: ImageInput | null) => void) | null>(null)
  const [liveCamera, setLiveCamera] = useState(false)

  const settle = useCallback((v: ImageInput | null) => {
    resolver.current?.(v)
    resolver.current = null
  }, [])

  const request = useCallback(
    (mode: CaptureMode) =>
      new Promise<ImageInput | null>((resolve) => {
        resolver.current?.(null)
        resolver.current = resolve
        if (mode === "camera" && !isTouchDevice() && typeof navigator.mediaDevices?.getUserMedia === "function") {
          setLiveCamera(true)
        } else {
          ;(mode === "camera" ? cameraInput : uploadInput).current?.click()
        }
      }),
    []
  )

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ""
      if (!file) return settle(null)
      try {
        const prepared = await prepareImageFile(file)
        playShutterSound()
        settle(prepared)
      } catch (err) {
        toast(err instanceof ImageError ? err.message : "Couldn't read that image. Please try another photo.", "error")
        settle(null)
      }
    },
    [settle, toast]
  )

  useEffect(() => {
    const inputs = [cameraInput.current, uploadInput.current]
    const onCancel = () => settle(null)
    inputs.forEach((i) => i?.addEventListener("cancel", onCancel))
    return () => inputs.forEach((i) => i?.removeEventListener("cancel", onCancel))
  }, [settle])

  return (
    <Ctx.Provider value={request}>
      {children}
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} aria-hidden="true" tabIndex={-1} />
      <input
        ref={uploadInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        className="hidden"
        onChange={onFile}
        aria-hidden="true"
        tabIndex={-1}
      />
      {liveCamera && (
        <LiveCamera
          onCapture={(img) => {
            setLiveCamera(false)
            settle(img)
          }}
          onClose={() => {
            setLiveCamera(false)
            settle(null)
          }}
          onUnavailable={() => {
            setLiveCamera(false)
            cameraInput.current?.click()
          }}
        />
      )}
    </Ctx.Provider>
  )
}

/** Desktop: getUserMedia with a live preview and a capture button. */
function LiveCamera({
  onCapture,
  onClose,
  onUnavailable,
}: {
  onCapture: (img: ImageInput) => void
  onClose: () => void
  onUnavailable: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const unavailable = useRef(onUnavailable)
  unavailable.current = onUnavailable

  useEffect(() => {
    let stream: MediaStream | null = null
    let stopped = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (stopped) return s.getTracks().forEach((t) => t.stop())
        stream = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
          videoRef.current.play().catch(() => {})
        }
      })
      .catch(() => unavailable.current())
    return () => {
      stopped = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/30 px-4" role="dialog" aria-modal="true" aria-label="Camera">
      <div className="ww-pop w-full max-w-[480px] overflow-hidden rounded-[24px] bg-ink shadow-lift">
        <div className="relative aspect-[3/4] w-full bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            onLoadedData={() => setReady(true)}
            className="h-full w-full object-cover"
          />
          {!ready && <p className="absolute inset-0 grid place-items-center text-sm text-sub">Starting camera…</p>}
          <button onClick={onClose} className="absolute top-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-black/45 text-ink" aria-label="Close camera">
            <X size={20} />
          </button>
        </div>
        <div className="flex justify-center p-4">
          <Button
            variant="light"
            size="lg"
            disabled={!ready}
            onClick={() => {
              if (videoRef.current) {
                playShutterSound()
                onCapture(prepareFromVideo(videoRef.current))
              }
            }}
          >
            <Camera size={20} /> Capture
          </Button>
        </div>
      </div>
    </div>
  )
}
