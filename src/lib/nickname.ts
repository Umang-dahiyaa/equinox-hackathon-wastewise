const BAD_WORDS = [
  "fuck", "shit", "bitch", "bastard", "dick", "cunt", "slut", "whore", "nigg", "fag",
  "chutiya", "chutia", "madarchod", "behenchod", "bhenchod", "bhosdi", "gaand", "gandu", "lund", "randi", "harami", "kamina",
]

export const NICKNAME_HINT = "3–16 characters: letters, numbers, spaces or _"

export function cleanNickname(raw: string) {
  return raw.replace(/\s+/g, " ").trim()
}

/** Returns an error message, or null when the nickname is OK. */
export function validateNickname(raw: string): string | null {
  const name = cleanNickname(raw)
  if (name.length < 3 || name.length > 16) return "Nicknames need 3–16 characters."
  if (!/^[A-Za-z0-9_ ]+$/.test(name)) return "Use only letters, numbers, spaces or _."
  if ((name.match(/\d/g) ?? []).length >= 7) return "Please don't use a phone number as a nickname."
  const squashed = name.toLowerCase().replace(/[\s_]+/g, "").replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s")
  if (BAD_WORDS.some((w) => squashed.includes(w))) return "Let's keep it friendly — try another nickname."
  return null
}

export function nicknameKey(name: string) {
  return cleanNickname(name).toLowerCase()
}

/** "GreenMadhav" → "GreenMadhav_2", keeping within 16 characters. */
export function numberedNickname(name: string, n: number) {
  const suffix = `_${n}`
  return cleanNickname(name).slice(0, 16 - suffix.length).trimEnd() + suffix
}

export const AVATARS = ["🌱", "🌿", "🍃", "🌻", "🌍", "♻️", "🦋", "🐝", "🌈", "☕"]
