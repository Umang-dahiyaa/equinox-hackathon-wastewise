// Gemini identifies the item. The guide decides the bin.
// Everything shown on screen (category, steps, rule text) comes from the guide file.

import { getCategory, getRule } from "@/lib/guide"
import { identifyItem } from "@/lib/gemini"
import type { HistoryEntry, Outcome, ScanAI, ScanInput } from "@/lib/types"
import { uuid } from "@/lib/utils"

export const MAX_CLARIFY_ROUNDS = 2

export function interpret(ai: ScanAI, roundsAnswered: number): Outcome {
  if (ai.needs_clarification) {
    const question = ai.clarifying_question?.trim()
    if (question && roundsAnswered < MAX_CLARIFY_ROUNDS) {
      return { kind: "clarify", ai, question, options: ai.clarifying_options.filter(Boolean).slice(0, 4) }
    }
    return { kind: "not_found", ai, reason: "unclear" }
  }
  const rule = ai.rule_found ? getRule(ai.rule_id) : null
  const category = rule ? getCategory(rule.category_id) : null
  if (rule && category) return { kind: "result", ai, rule, category }
  return { kind: "not_found", ai, reason: "no_rule" }
}

export async function runIdentification(input: ScanInput): Promise<Outcome> {
  const ai = await identifyItem(input)
  return interpret(ai, input.clarifications.length)
}

export function inputType(input: ScanInput): HistoryEntry["input_type"] {
  if (input.image && input.description.trim()) return "photo+text"
  return input.image ? "photo" : "text"
}

/** Builds the history record for a finished scan ("✅ Got it"). */
export function buildHistoryEntry(opts: {
  input: ScanInput
  outcome: Outcome
  originalAi: ScanAI | null
  points: number
}): HistoryEntry {
  const { input, outcome, originalAi, points } = opts
  const ai = outcome.ai
  const rule = outcome.kind === "result" ? outcome.rule : null
  const category = outcome.kind === "result" ? outcome.category : null
  return {
    id: uuid(),
    timestamp: new Date().toISOString(),
    input_type: inputType(input),
    thumbnail: input.image?.thumbnail ?? null,
    description: input.description,
    clarifications: input.clarifications,
    ai_item: originalAi?.item ?? ai?.item ?? input.description ?? "Unknown item",
    ai_material: ai?.material ?? "",
    confidence: ai?.confidence ?? null,
    corrected_item: input.correctedItem ?? null,
    rule_id: rule?.rule_id ?? null,
    category_id: category?.id ?? null,
    rule_found: !!rule,
    rule_snapshot:
      rule && category
        ? {
            rule_id: rule.rule_id,
            source_text: rule.source_text,
            preparation: rule.preparation,
            category_label: category.label,
            bin: category.bin,
          }
        : null,
    points_awarded: points,
  }
}

/** The item key used for the "same item within 10 minutes" fair-play check. */
export function itemKey(outcome: Outcome, input: ScanInput) {
  if (outcome.kind === "result") return `rule:${outcome.rule.rule_id}`
  const name = input.correctedItem ?? outcome.ai?.item ?? input.description
  return `item:${(name || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()}`
}
