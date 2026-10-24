// Which scanned items are sellable scrap, i.e. something a kabadiwala would buy.
// Decided from the item name, material and bin; used for the scan-result popup and
// to pre-set the Kabadiwala section's filter.

import type { Outcome, ScanAI } from "@/lib/types"

export type ScrapKind = "metal" | "paper" | "plastic" | "ewaste"

export const SCRAP_KINDS: { id: ScrapKind; label: string; emoji: string; buyer: string }[] = [
  { id: "metal", label: "Metal", emoji: "🔩", buyer: "scrap metal buyers" },
  { id: "paper", label: "Paper & raddi", emoji: "📰", buyer: "raddi buyers" },
  { id: "plastic", label: "Plastic", emoji: "🧴", buyer: "plastic scrap buyers" },
  { id: "ewaste", label: "E-waste", emoji: "🔌", buyer: "e-waste buyers" },
]

export const scrapLabel = (k: ScrapKind) => SCRAP_KINDS.find((s) => s.id === k)!.label

const RULES: { kind: ScrapKind; match: RegExp; unless?: RegExp }[] = [
  {
    kind: "metal",
    match: /\b(metal|metallic|alumin(i)?um|steel|iron|copper|brass|bronze|tin|cans?|foil tray|wire|rods?|pipes?|utensils?|scrap)\b/i,
    unless: /\b(foil wrapper|chips|multilayer|metallised|metallized)\b/i,
  },
  {
    kind: "paper",
    match: /\b(newspapers?|cardboard|corrugated|cartons?|boxes|paper|magazines?|books?|notebooks?|office paper)\b/i,
    unless: /\b(tissue|napkin|paper cup|paper plate|greasy|soiled|food-soiled|towel|wet|tetra|laminated)\b/i,
  },
  {
    kind: "plastic",
    match: /\b(plastic bottles?|pet|hdpe|pp|plastic (container|jar|bucket|crate|chair)s?|buckets?|crates?|jerry ?cans?)\b/i,
    unless: /\b(wrapper|film|bag|pouch|multilayer|chips|straw|styrofoam|thermocol|cling)\b/i,
  },
  {
    kind: "ewaste",
    match: /\b(batter(y|ies)|chargers?|cables?|phones?|mobiles?|laptops?|computers?|keyboards?|mouse|electronics?|electronic|circuit|appliances?|bulbs?|tube ?lights?)\b/i,
  },
]

/** Scrap kinds in one identified item. */
export function scrapKindsFor(ai: Pick<ScanAI, "item" | "material"> | null | undefined, categoryId?: string | null): ScrapKind[] {
  if (!ai) return []
  const text = `${ai.item} ${ai.material}`
  const kinds = RULES.filter((r) => r.match.test(text) && !r.unless?.test(text)).map((r) => r.kind)
  if (categoryId === "ewaste" && !kinds.includes("ewaste")) kinds.push("ewaste")
  // anything wet or sanitary isn't sold, whatever it's made of
  if (categoryId === "wet" || categoryId === "reject") return []
  return kinds
}

export interface ScrapFind {
  kinds: ScrapKind[]
  /** the scrap items, for the popup text */
  items: string[]
}

/** Sellable scrap in a scan result (single or multi-item), or null if there's none. */
export function scrapInOutcome(outcome: Outcome | null): ScrapFind | null {
  if (!outcome || outcome.kind === "clarify") return null
  const singles =
    outcome.kind === "multi"
      ? outcome.parts.map((p) => ({ ai: p.ai, cat: p.outcome.kind === "result" ? p.outcome.category.id : null }))
      : [{ ai: outcome.ai, cat: outcome.kind === "result" ? outcome.category.id : null }]
  const kinds = new Set<ScrapKind>()
  const items: string[] = []
  for (const s of singles) {
    const k = scrapKindsFor(s.ai, s.cat)
    if (k.length && s.ai) {
      k.forEach((x) => kinds.add(x))
      items.push(s.ai.item)
    }
  }
  return kinds.size ? { kinds: SCRAP_KINDS.map((s) => s.id).filter((k) => kinds.has(k)), items } : null
}
