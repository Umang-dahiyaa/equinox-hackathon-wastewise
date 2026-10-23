import { GoogleGenAI, Type, type Content, type Part, type Schema } from "@google/genai"
import { guideJsonString } from "@/lib/guide"
import { dataUrlToInline } from "@/lib/image"
import type { ImageInput, QA, ScanAI, ScanInput } from "@/lib/types"

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const model = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) || "gemini-2.5-flash"

export const geminiConfigured = !!apiKey

let client: GoogleGenAI | null = null
function getClient() {
  if (!apiKey) throw new AIError("not_configured")
  client ??= new GoogleGenAI({ apiKey })
  return client
}

export class AIError extends Error {
  constructor(public kind: "network" | "invalid_json" | "not_configured") {
    super(kind)
  }
}

// ---------- system instructions ----------

export const SCANNER_INSTRUCTION = `You are WasteWise, a waste-identification assistant for the Zenith campus. Your job has two steps:
1. Identify the item and its likely material from the photo and/or description.
2. Match it to a rule in the supplied CAMPUS WASTE GUIDE (JSON below).

Rules you must follow:
- Use ONLY the supplied guide to decide the disposal category and preparation steps. Never use general knowledge or other cities' rules for disposal decisions.
- If the photo is blurry, partly hidden, or the material can't be determined (e.g. paper cup vs plastic-lined cup, single-material film vs multilayer wrapper, clean vs greasy), set needs_clarification to true and ask ONE short, specific question with 2–4 answer options. Do not guess.
- If you can identify the item but no rule in the guide matches it, set rule_found to false and leave rule_id null. Do not invent a rule.
- If the image doesn't show a waste item at all, say so in the item field and set needs_clarification to true.
- Respond ONLY with JSON matching the response schema.

CAMPUS WASTE GUIDE:
${guideJsonString}`

const LULU_INSTRUCTION = `You are Lulu, the friendly WasteWise assistant for the Zenith campus. You are a paper coffee cup with robot eyes. Keep replies short (1–3 sentences), warm and clear. Reply in the user's language style (English or Hinglish).

Decide the user's intent: identify_item, answer_clarification, correct_item, show_history, show_stats, show_rank, show_leaderboard, explain_method, start_quiz, category_question, or off_topic.

For identify_item, answer_clarification and correct_item, follow the WasteWise rules exactly: use ONLY the supplied campus waste guide; ask ONE clarifying question when uncertain; set rule_found to false when the guide has no matching rule. Never invent rules, numbers, ranks or statistics — the app fills in all numbers.

For category_question, set category_id to the guide category the user asks about (e.g. "dry" for the blue bin) and do not list the rules yourself — the app lists them from the guide.

Do not quote rule text, bin names for an item, points, ranks, streaks or counts in lulu_message: the app shows those itself in a card below your message.

Respond ONLY with JSON matching the schema.`

// ---------- schemas ----------

const scanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    item: { type: Type.STRING },
    material: { type: Type.STRING },
    confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
    needs_clarification: { type: Type.BOOLEAN },
    clarifying_question: { type: Type.STRING, nullable: true },
    clarifying_options: { type: Type.ARRAY, items: { type: Type.STRING } },
    rule_found: { type: Type.BOOLEAN },
    rule_id: { type: Type.STRING, nullable: true },
    reasoning_note: { type: Type.STRING },
  },
  required: [
    "item",
    "material",
    "confidence",
    "needs_clarification",
    "clarifying_question",
    "clarifying_options",
    "rule_found",
    "rule_id",
    "reasoning_note",
  ],
  propertyOrdering: [
    "item",
    "material",
    "confidence",
    "needs_clarification",
    "clarifying_question",
    "clarifying_options",
    "rule_found",
    "rule_id",
    "reasoning_note",
  ],
}

export const LULU_INTENTS = [
  "identify_item",
  "answer_clarification",
  "correct_item",
  "show_history",
  "show_stats",
  "show_rank",
  "show_leaderboard",
  "explain_method",
  "start_quiz",
  "category_question",
  "off_topic",
] as const
export type LuluIntent = (typeof LULU_INTENTS)[number]

export interface LuluAI {
  intent: LuluIntent
  lulu_message: string
  lulu_mood: "happy" | "confused" | "sorry" | "idle"
  item: string | null
  material: string | null
  confidence: "high" | "medium" | "low" | null
  needs_clarification: boolean
  clarifying_question: string | null
  clarifying_options: string[]
  rule_found: boolean
  rule_id: string | null
  category_id: string | null
}

const luluSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    intent: { type: Type.STRING, enum: [...LULU_INTENTS] },
    lulu_message: { type: Type.STRING },
    lulu_mood: { type: Type.STRING, enum: ["happy", "confused", "sorry", "idle"] },
    item: { type: Type.STRING, nullable: true },
    material: { type: Type.STRING, nullable: true },
    confidence: { type: Type.STRING, enum: ["high", "medium", "low"], nullable: true },
    needs_clarification: { type: Type.BOOLEAN },
    clarifying_question: { type: Type.STRING, nullable: true },
    clarifying_options: { type: Type.ARRAY, items: { type: Type.STRING } },
    rule_found: { type: Type.BOOLEAN },
    rule_id: { type: Type.STRING, nullable: true },
    category_id: { type: Type.STRING, nullable: true },
  },
  required: [
    "intent",
    "lulu_message",
    "lulu_mood",
    "item",
    "material",
    "confidence",
    "needs_clarification",
    "clarifying_question",
    "clarifying_options",
    "rule_found",
    "rule_id",
    "category_id",
  ],
}

// ---------- prompt building ----------

function imagePart(image: ImageInput): Part {
  return { inlineData: dataUrlToInline(image.dataUrl) }
}

function describeInput(input: ScanInput) {
  const lines: string[] = []
  if (input.correctedItem) {
    lines.push(
      `The user corrected the identification. The item is actually: "${input.correctedItem}". Treat this as the item name (text only) and match it to the guide.`
    )
  } else {
    lines.push(input.image ? "The photo above shows the item." : "There is no photo; identify the item from the description.")
    if (input.description.trim()) lines.push(`User description: "${input.description.trim()}"`)
  }
  if (input.clarifications.length) {
    lines.push("Clarifications already answered by the user:")
    input.clarifications.forEach((c: QA) => lines.push(`- Q: ${c.question}\n  A: ${c.answer}`))
    lines.push("Use these answers. Only ask another question if the material is still genuinely unclear.")
  }
  return lines.join("\n")
}

async function callJson<T>(contents: Content[], systemInstruction: string, schema: Schema, validate: (v: unknown) => v is T): Promise<T> {
  const ai = getClient()
  for (let attempt = 0; attempt < 2; attempt++) {
    let text: string | undefined
    try {
      const res = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.2,
        },
      })
      text = res.text
    } catch (err) {
      console.error("Gemini request failed", err)
      throw new AIError("network")
    }
    try {
      const parsed = JSON.parse(text ?? "")
      if (validate(parsed)) return parsed
    } catch {
      // fall through to retry
    }
  }
  throw new AIError("invalid_json")
}

function isScanAI(v: unknown): v is ScanAI {
  const o = v as ScanAI
  return !!o && typeof o.item === "string" && typeof o.needs_clarification === "boolean" && typeof o.rule_found === "boolean"
}

function isLuluAI(v: unknown): v is LuluAI {
  const o = v as LuluAI
  return !!o && typeof o.lulu_message === "string" && (LULU_INTENTS as readonly string[]).includes(o.intent)
}

// ---------- public calls ----------

/** Scanner flow (2.3–2.5). One call; retries once silently on invalid JSON. */
export async function identifyItem(input: ScanInput): Promise<ScanAI> {
  const parts: Part[] = []
  if (input.image && !input.correctedItem) parts.push(imagePart(input.image))
  parts.push({ text: describeInput(input) })
  const ai = await callJson([{ role: "user", parts }], SCANNER_INSTRUCTION, scanSchema, isScanAI)
  return { ...ai, clarifying_options: Array.isArray(ai.clarifying_options) ? ai.clarifying_options.slice(0, 4) : [] }
}

export interface LuluTurn {
  text: string
  image: ImageInput | null
  /** An identification waiting on a clarifying answer, if any. */
  pending: (ScanInput & { question: string }) | null
  /** The last identified item, so "that's wrong, it's X" can be understood. */
  lastItem: string | null
  /** Recent chat lines, oldest first, for context. */
  recent: { role: "user" | "lulu"; text: string }[]
}

/** Lulu: one call per user turn (3.6). */
export async function askLulu(turn: LuluTurn): Promise<LuluAI> {
  const parts: Part[] = []
  const image = turn.image ?? turn.pending?.image ?? null
  if (image) parts.push(imagePart(image))

  const ctx: string[] = []
  if (turn.recent.length) {
    ctx.push("Recent conversation:")
    turn.recent.slice(-6).forEach((m) => ctx.push(`${m.role === "user" ? "User" : "Lulu"}: ${m.text}`))
  }
  if (turn.pending) {
    ctx.push(
      `\nAn identification is waiting for the user's answer. Original description: "${turn.pending.description || "(none)"}". ` +
        `You asked: "${turn.pending.question}". If the user's message answers it, use intent answer_clarification and identify the item using the photo (if any), the description and the answer.`
    )
    if (turn.pending.clarifications.length) {
      ctx.push("Earlier answers: " + turn.pending.clarifications.map((c) => `${c.question} → ${c.answer}`).join("; "))
    }
  }
  if (turn.lastItem) ctx.push(`The last item identified in this chat was: "${turn.lastItem}".`)
  if (turn.image) ctx.push("The user just sent the photo above.")
  ctx.push(`\nUser message: "${turn.text || (turn.image ? "(photo only)" : "")}"`)
  parts.push({ text: ctx.join("\n") })

  return callJson(
    [{ role: "user", parts }],
    `${LULU_INSTRUCTION}\n\n--- WasteWise scanner rules ---\n${SCANNER_INSTRUCTION}`,
    luluSchema,
    isLuluAI
  )
}
