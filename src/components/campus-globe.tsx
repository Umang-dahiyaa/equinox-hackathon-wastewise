import { useMemo } from "react"
import { Globe3D, type Globe3DConfig, type GlobeFocus, type GlobeMarker } from "@/components/ui/3d-globe"
import { cn, prefersReducedMotion } from "@/lib/utils"

/** The campus (Sohna, Haryana — approximate coordinates). */
export const CAMPUS = { lat: 28.25, lng: 77.07 }
const campusMarker: GlobeMarker = { ...CAMPUS, src: "/favicon.svg", label: "Our campus", id: "campus" }

// Same look as the Aceternity 3d-globe demo; no auto-rotation with reduced motion.
const baseConfig: Globe3DConfig = {
  atmosphereColor: "#4da6ff",
  atmosphereIntensity: 20,
  bumpScale: 5,
  autoRotateSpeed: prefersReducedMotion() ? 0 : 0.3,
  initialRotation: { x: 0, y: 0 },
  // a little brighter than the demo, which is tuned for dark pages
  ambientIntensity: 1.4,
  pointLightIntensity: 2.2,
}

interface Props {
  className?: string
  /** pins besides the campus (dumps, scans…) */
  markers?: GlobeMarker[]
  showCampus?: boolean
  label?: string
  onMarkerClick?: (marker: GlobeMarker) => void
  onMarkerHover?: (marker: GlobeMarker | null) => void
  focus?: GlobeFocus | null
  onFocusArrive?: () => void
  /** allow the camera close to the surface (for flying in) */
  closeUp?: boolean
  /** no auto-rotation */
  still?: boolean
}

export function CampusGlobe({ className, markers = [], showCampus = true, label, onMarkerClick, onMarkerHover, focus, onFocusArrive, closeUp, still }: Props) {
  const all = useMemo(() => (showCampus ? [campusMarker, ...markers] : markers), [showCampus, markers])
  const config = useMemo<Globe3DConfig>(
    () => ({ ...baseConfig, ...(closeUp ? { minDistance: 2.3 } : null), ...(still ? { autoRotateSpeed: 0 } : null) }),
    [closeUp, still]
  )
  return (
    <div role="img" aria-label={label ?? "Rotating 3D globe showing the campus"} className={cn("w-full", className)}>
      <Globe3D markers={all} config={config} className="h-full" onMarkerClick={onMarkerClick} onMarkerHover={onMarkerHover} focus={focus} onFocusArrive={onFocusArrive} />
    </div>
  )
}
