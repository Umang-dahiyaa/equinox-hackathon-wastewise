// Google Places API (New) text search, run on the server so the key never reaches the browser.
// Only a fixed set of searches is allowed (each call is billed), and results are cached.

import type { Express } from "express"

const KEY = process.env.GOOGLE_PLACES_API_KEY

export interface Place {
  id: string
  name: string
  address?: string
  lat?: number
  lng?: number
  distanceKm?: number
  rating?: number
  reviews?: number
  phone?: string
  openNow?: boolean
  mapsUrl: string
}

/** The searches the app may run, by id. */
export const PLACE_SEARCHES: Record<string, string> = {
  "scrap-all": "kabadiwala scrap dealer",
  "clean-home": "home deep cleaning service",
  "clean-kitchen": "kitchen deep cleaning service",
  "clean-bathroom": "bathroom cleaning service",
  "clean-sofa": "sofa and carpet cleaning service",
  "clean-pest": "pest control service",
  "clean-tank": "water tank cleaning service",
  "clean-office": "office deep cleaning service",
  "clean-staff": "housekeeping services",
}

const FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.nationalPhoneNumber",
  "places.googleMapsUri",
  "places.currentOpeningHours.openNow",
  "places.businessStatus",
].join(",")

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const cache = new Map<string, { at: number; places: Place[] }>()
const CACHE_MS = 30 * 60 * 1000

export const placesAvailable = () => !!KEY

/** Runs one allowed search near a point. Throws if the key is missing or Google refuses. */
export async function searchPlaces(searchId: string, lat: number, lng: number, radiusM = 15000): Promise<Place[]> {
  const textQuery = PLACE_SEARCHES[searchId]
  if (!textQuery) throw new Error(`unknown search ${searchId}`)
  if (!KEY) throw new Error("GOOGLE_PLACES_API_KEY is not set")
  const cacheKey = `${searchId}@${lat.toFixed(2)},${lng.toFixed(2)}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.places

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": FIELDS },
    body: JSON.stringify({
      textQuery,
      locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: radiusM } },
      maxResultCount: 12,
    }),
    signal: AbortSignal.timeout(10000),
  })
  const json = (await res.json()) as {
    places?: {
      id: string
      displayName?: { text?: string }
      formattedAddress?: string
      location?: { latitude: number; longitude: number }
      rating?: number
      userRatingCount?: number
      nationalPhoneNumber?: string
      googleMapsUri?: string
      currentOpeningHours?: { openNow?: boolean }
      businessStatus?: string
    }[]
    error?: { status?: string; message?: string }
  }
  if (!res.ok) throw new Error(`Places ${res.status} ${json.error?.status ?? ""}`)

  const places: Place[] = (json.places ?? [])
    .filter((p) => p.businessStatus !== "CLOSED_PERMANENTLY")
    .map((p) => {
      const pLat = p.location?.latitude
      const pLng = p.location?.longitude
      return {
        id: p.id,
        name: p.displayName?.text ?? "Unnamed place",
        address: p.formattedAddress,
        lat: pLat,
        lng: pLng,
        distanceKm: pLat !== undefined && pLng !== undefined ? Math.round(distanceKm(lat, lng, pLat, pLng) * 10) / 10 : undefined,
        rating: p.rating,
        reviews: p.userRatingCount,
        phone: p.nationalPhoneNumber,
        openNow: p.currentOpeningHours?.openNow,
        mapsUrl: p.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.displayName?.text ?? "")}&query_place_id=${p.id}`,
      }
    })
    .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99))
  cache.set(cacheKey, { at: Date.now(), places })
  return places
}

export function registerPlacesRoutes(app: Express) {
  // POST /api/places { search: "clean-home", lat, lng }
  app.post("/api/places", async (req, res) => {
    const { search, lat, lng } = req.body ?? {}
    if (typeof search !== "string" || !PLACE_SEARCHES[search]) return res.status(400).json({ error: "Unknown search" })
    if (typeof lat !== "number" || typeof lng !== "number" || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ error: "Valid lat and lng are required" })
    }
    if (!placesAvailable()) return res.json({ places: [], status: "no_key" })
    try {
      res.json({ places: await searchPlaces(search, lat, lng), status: "ok" })
    } catch (err) {
      console.warn("[places]", (err as Error).message)
      res.json({ places: [], status: "error" })
    }
  })
}
