import { supabase } from './supabase.js'

// 영어 문장을 소리내어 읽어준다 (듣기 버튼).
// 1순위: Groq PlayAI TTS(원어민급) → smooth-worker의 tts 액션으로 오디오를 받아 재생.
// 실패(네트워크/미배포 등) 시: 브라우저 내장 Web Speech로 폴백.
let currentAudio = null
const cache = new Map() // text -> objectURL (같은 문장 재요청 방지 + 즉시 재생)

function b64ToBlobUrl(b64, mime) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: mime || 'audio/wav' }))
}

function playUrl(url) {
  stopSpeak()
  const a = new Audio(url)
  currentAudio = a
  a.play().catch(() => {})
}

// 브라우저 내장 음성 (폴백)
function speakBrowser(text) {
  try {
    const synth = window.speechSynthesis
    if (!synth || !text) return
    synth.cancel()
    const u = new SpeechSynthesisUtterance(String(text))
    u.lang = 'en-US'
    u.rate = 0.95
    const voices = synth.getVoices()
    const v = voices.find((x) => /en-US/i.test(x.lang)) || voices.find((x) => /^en/i.test(x.lang))
    if (v) u.voice = v
    synth.speak(u)
  } catch {
    /* speech unsupported — no-op */
  }
}

export async function speak(text) {
  const t = String(text || '').trim()
  if (!t) return
  // 캐시된 오디오는 즉시(동기) 재생 — 사용자 제스처 컨텍스트 유지에도 유리.
  if (cache.has(t)) {
    playUrl(cache.get(t))
    return
  }
  try {
    const { data, error } = await supabase.functions.invoke('smooth-worker', {
      body: { action: 'tts', text: t },
    })
    if (error || !data?.audio) throw new Error(data?.error || 'tts failed')
    const url = b64ToBlobUrl(data.audio, data.mime)
    cache.set(t, url)
    playUrl(url)
  } catch {
    speakBrowser(t)
  }
}

export function stopSpeak() {
  try {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio = null
    }
  } catch {
    /* no-op */
  }
  try {
    window.speechSynthesis && window.speechSynthesis.cancel()
  } catch {
    /* no-op */
  }
}
