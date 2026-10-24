import { useEffect, useRef } from "react"
import { MAP_ID, pinElement, useGoogleMaps } from "@/lib/googleMaps"
import { useTheme } from "@/lib/theme"

export interface MapDealer {
  id: string
  name: string
  lat: number
  lng: number
}

const YOU_PIN = '<div style="width:18px;height:18px;border-radius:9999px;background:#2F80FF;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>'
const DEALER_PIN =
  '<div style="width:32px;height:32px;border-radius:9999px;background:#08482D;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.25);display:grid;place-items:center;font-size:15px;cursor:pointer">♻️</div>'

/** Google map with you and each dealer; tapping a dealer calls onPick. */
export function DealerMap({ center, dealers, onPick }: { center: { lat: number; lng: number }; dealers: MapDealer[]; onPick?: (id: string) => void }) {
  const status = useGoogleMaps()
  const [theme] = useTheme()
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<google.maps.Map | null>(null)
  const markers = useRef<google.maps.marker.AdvancedMarkerElement[]>([])

  // the colour scheme is fixed when a map is created, so a theme change makes a new map
  useEffect(() => {
    if (status !== "ready" || !box.current) return
    map.current = new google.maps.Map(box.current, {
      center,
      zoom: 13,
      mapId: MAP_ID,
      colorScheme: theme === "dark" ? google.maps.ColorScheme.DARK : google.maps.ColorScheme.LIGHT,
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
    })
    return () => {
      markers.current.forEach((m) => (m.map = null))
      markers.current = []
      map.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, theme])

  useEffect(() => {
    const m = map.current
    if (!m) return
    markers.current.forEach((mk) => (mk.map = null))
    const you = new google.maps.marker.AdvancedMarkerElement({ map: m, position: center, content: pinElement(YOU_PIN, "You"), title: "You" })
    const pins = dealers.map((d) => {
      const mk = new google.maps.marker.AdvancedMarkerElement({ map: m, position: { lat: d.lat, lng: d.lng }, content: pinElement(DEALER_PIN, d.name), title: d.name, gmpClickable: true })
      mk.addListener("gmp-click", () => onPick?.(d.id))
      return mk
    })
    markers.current = [you, ...pins]
    if (dealers.length) {
      const bounds = new google.maps.LatLngBounds(center)
      dealers.forEach((d) => bounds.extend({ lat: d.lat, lng: d.lng }))
      m.fitBounds(bounds, 40)
      google.maps.event.addListenerOnce(m, "idle", () => {
        if ((m.getZoom() ?? 0) > 15) m.setZoom(15)
      })
    } else {
      m.setCenter(center)
      m.setZoom(13)
    }
  }, [center.lat, center.lng, dealers, onPick, status, theme])

  if (status === "error") {
    return <p className="tile px-4 py-3 text-sm text-sub">The map needs a Google Maps key (VITE_GOOGLE_MAPS_API_KEY) that allows this site. The list below still works.</p>
  }
  return (
    <div className="relative isolate h-64 w-full overflow-hidden rounded-[18px] bg-page lg:h-80">
      <div ref={box} className="h-full w-full" />
      {status === "loading" && <p className="absolute inset-0 grid place-items-center text-sm text-sub">Loading map…</p>}
    </div>
  )
}
