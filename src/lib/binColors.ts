// Colours for multi-item scans. Each bin keeps its real-world hue (blue bin = blue),
// in a brighter "vivid" tone that stands out on photos, a "deep" tone that carries
// white text, and theme-aware "text" and "soft" tones (CSS variables in index.css,
// with light and dark versions) for coloured text and tinted backgrounds.

export interface BinTone {
  vivid: string
  deep: string
  text: string
  soft: string
}

const tone = (key: string, vivid: string, deep: string): BinTone => ({
  vivid,
  deep,
  text: `var(--bin-${key}-text)`,
  soft: `var(--bin-${key}-soft)`,
})

const TONES: Record<string, BinTone> = {
  dry: tone("dry", "#2F80FF", "#1453BF"),
  wet: tone("wet", "#22C55E", "#11743A"),
  hazardous: tone("hazardous", "#FF4136", "#C0261B"),
  reject: tone("reject", "#94A3B8", "#475569"),
  ewaste: tone("ewaste", "#B05CFF", "#7232C2"),
}

/** Items the app couldn't place in a bin. */
export const UNSORTED_TONE: BinTone = tone("unsorted", "#FFAD1F", "#A35F00")

export function binTone(categoryId: string | null | undefined): BinTone {
  return (categoryId && TONES[categoryId]) || UNSORTED_TONE
}

function mix(hex: string, target: number, amount: number) {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(c + (target - c) * amount))
  return "#" + ch.map((c) => c.toString(16).padStart(2, "0")).join("")
}

/**
 * Shade for the k-th item (0-based) in the same bin: the bin's own tone first,
 * then alternately lighter and darker, so items sharing a bin stay distinct.
 */
export function shadeFor(hex: string, k: number) {
  if (k === 0) return hex
  const step = Math.ceil(k / 2) * 0.22
  return k % 2 ? mix(hex, 255, Math.min(step, 0.5)) : mix(hex, 0, Math.min(step, 0.45))
}
