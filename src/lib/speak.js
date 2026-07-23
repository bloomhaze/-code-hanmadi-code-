// Minimal Web Speech helper — reads English aloud (used by 듣기 buttons).
let current = null

export function speak(text) {
  try {
    const synth = window.speechSynthesis
    if (!synth || !text) return
    synth.cancel()
    const u = new SpeechSynthesisUtterance(String(text))
    u.lang = 'en-US'
    u.rate = 0.95
    const voices = synth.getVoices()
    const v =
      voices.find((x) => /en-US/i.test(x.lang)) || voices.find((x) => /^en/i.test(x.lang))
    if (v) u.voice = v
    current = u
    synth.speak(u)
  } catch {
    /* speech unsupported — no-op */
  }
}

export function stopSpeak() {
  try {
    window.speechSynthesis && window.speechSynthesis.cancel()
    current = null
  } catch {
    /* no-op */
  }
}
