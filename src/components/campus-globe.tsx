import { Globe3D, type Globe3DConfig, type GlobeMarker } from "@/components/ui/3d-globe"
import { cn, prefersReducedMotion } from "@/lib/utils"

// One marker only: the campus (Sohna, Haryana — approximate coordinates).
const markers: GlobeMarker[] = [{ lat: 28.25, lng: 77.07, src: "/favicon.svg", label: "Our campus" }]

// Same look as the Aceternity 3d-globe demo; no auto-rotation with reduced motion.
const config: Globe3DConfig = {
  atmosphereColor: "#4da6ff",
  atmosphereIntensity: 20,
  bumpScale: 5,
  autoRotateSpeed: prefersReducedMotion() ? 0 : 0.3,
  initialRotation: { x: 0, y: 0 },
  // a little brighter than the demo, which is tuned for dark pages
  ambientIntensity: 1.4,
  pointLightIntensity: 2.2,
}

export function CampusGlobe({ className }: { className?: string }) {
  return (
    <div role="img" aria-label="Rotating 3D globe showing the campus" className={cn("w-full", className)}>
      <Globe3D markers={markers} config={config} className="h-full" />
    </div>
  )
}
