// Web Audio synthesized sound effects for WasteWise camera and scanner interactions.
// Generates crisp, subtle auditory feedback without external audio file assets.

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return null
    if (!audioCtx) {
      audioCtx = new AudioContextClass()
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {})
    }
    return audioCtx
  } catch {
    return null
  }
}

/**
 * Subtle camera shutter sound effect:
 * Simulates a crisp mechanical dual shutter click with a gentle affirmative tone.
 */
export function playShutterSound() {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime

  // Click 1 (shutter opening)
  playClick(ctx, now, 0.15)
  // Click 2 (shutter closing, 60ms later)
  playClick(ctx, now + 0.06, 0.18)

  // Gentle confirmation harmonic ping (soft C6 1046Hz -> E6 1318Hz)
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = "sine"
  osc.frequency.setValueAtTime(1046.5, now + 0.07)
  osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.15)

  gain.gain.setValueAtTime(0.0001, now + 0.07)
  gain.gain.exponentialRampToValueAtTime(0.07, now + 0.09)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(now + 0.07)
  osc.stop(now + 0.28)
}

function playClick(ctx: AudioContext, time: number, volume: number) {
  const bufferSize = Math.floor(ctx.sampleRate * 0.025) // 25ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2))
  }

  const noise = ctx.createBufferSource()
  noise.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = "bandpass"
  filter.frequency.setValueAtTime(2400, time)
  filter.Q.setValueAtTime(2.2, time)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(volume, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)

  noise.start(time)
  noise.stop(time + 0.03)
}

/**
 * Subtle affirmative scan success chime (two gentle marimba-like bell tones).
 */
export function playScanSuccessSound() {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const notes = [659.25, 880] // E5 -> A5

  notes.forEach((freq, i) => {
    const startTime = now + i * 0.08
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(freq, startTime)

    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.exponentialRampToValueAtTime(0.09, startTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(startTime)
    osc.stop(startTime + 0.3)
  })
}
