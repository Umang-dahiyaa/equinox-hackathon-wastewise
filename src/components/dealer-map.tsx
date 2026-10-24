import { useEffect, useRef } from "react"
import L from "leaflet"

export interface MapDealer {
  id: string
  name: string
  lat: number
  lng: number
}

/** Small OpenStreetMap map: you plus each mapped scrap dealer. */
export function DealerMap({ center, dealers, onPick }: { center: { lat: number; lng: number }; dealers: MapDealer[]; onPick?: (id: string) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!box.current) return
    const m = L.map(box.current, { zoomControl: true, attributionControl: true }).setView([center.lat, center.lng], 13)
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(m)
    map.current = m
    layer.current = L.layerGroup().addTo(m)
    return () => {
      m.remove()
      map.current = null
    }
    // the map is created once; centre and pins update below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const m = map.current
    const g = layer.current
    if (!m || !g) return
    g.clearLayers()
    L.circleMarker([center.lat, center.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#2F80FF", fillOpacity: 1 }).bindTooltip("You").addTo(g)
    const pts: L.LatLngExpression[] = [[center.lat, center.lng]]
    for (const d of dealers) {
      const icon = L.divIcon({
        className: "",
        html: '<div style="width:30px;height:30px;border-radius:9999px;background:#08482D;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.25);display:grid;place-items:center;font-size:15px">♻️</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })
      L.marker([d.lat, d.lng], { icon, title: d.name })
        .bindTooltip(d.name)
        .on("click", () => onPick?.(d.id))
        .addTo(g)
      pts.push([d.lat, d.lng])
    }
    // measure after layout, or Leaflet fits the pins into a stale size
    const id = requestAnimationFrame(() => {
      m.invalidateSize()
      if (pts.length > 1) m.fitBounds(L.latLngBounds(pts), { padding: [32, 32], maxZoom: 15 })
      else m.setView([center.lat, center.lng], 13)
    })
    return () => cancelAnimationFrame(id)
  }, [center.lat, center.lng, dealers, onPick])

  // the height lives on the wrapper: the shared .leaflet-container style sets the map itself to 100%
  return (
    <div className="relative isolate h-64 w-full overflow-hidden rounded-[18px] lg:h-80">
      <div ref={box} className="h-full w-full" />
    </div>
  )
}
