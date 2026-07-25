import { supabase } from './supabase.js'

// 영어 문장을 소리내어 읽어준다 (듣기 버튼).
// 1순위: Azure Neural TTS(원어민급) — smooth-worker의 tts 액션.
//   서버에서 Supabase Storage에 캐시하므로 같은 문장은 1번만 생성된다.
//   응답은 { url }(캐시 파일) 또는 { audio(base64), mime }.
// 실패(미설정/네트워크) 시: 브라우저 내장 음성 중 가장 자연스러운 것으로 폴백.
let currentAudio = null
const urlCache = new Map() // text -> 재생용 URL (세션 내 재요청 방지)

function playUrl(url) {
  stopSpeak()
  const a = new Audio(url)
  currentAudio = a
  a.play().catch(() => {})
}

function b64ToUrl(b64, mime) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: mime || 'audio/mpeg' }))
}

export async function speak(text) {
  const t = String(text || '').trim()
  if (!t) return
  if (urlCache.has(t)) {
    playUrl(urlCache.get(t))
    return
  }
  try {
    const { data, error } = await supabase.functions.invoke('smooth-worker', {
      body: { action: 'tts', text: t },
    })
    if (error) throw new Error('invoke error')
    if (data?.error) throw new Error(data.error)
    const url = data?.url || (data?.audio ? b64ToUrl(data.audio, data.mime) : null)
    if (!url) throw new Error('no audio')
    urlCache.set(t, url)
    playUrl(url)
  } catch {
    speakBrowser(t)
  }
}

// ---- 폴백: 브라우저 Web Speech (가장 자연스러운 음성 선택) ----
let cachedVoice = null

function getVoicesAsync() {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis
    if (!synth) return resolve([])
    const v = synth.getVoices()
    if (v && v.length) return resolve(v)
    let done = false
    const finish = () => {
      if (done) return
      done = true
      resolve(synth.getVoices() || [])
    }
    synth.onvoiceschanged = finish
    setTimeout(finish, 600)
  })
}

function pickVoice(voices) {
  const enUS = voices.filter((v) => /^en[-_]?US/i.test(v.lang))
  const pool = enUS.length ? enUS : voices.filter((v) => /^en/i.test(v.lang))
  if (!pool.length) return null
  const score = (v) => {
    const n = (v.name || '').toLowerCase()
    let s = 0
    if (/natural|neural|enhanced|premium/.test(n)) s += 100
    if (/online/.test(n)) s += 60
    if (v.localService === false) s += 30
    if (/google/.test(n)) s += 40
    if (/microsoft/.test(n)) s += 25
    if (/samantha|aria|jenny|ava|allison|emma|zoe|siri|natasha/.test(n)) s += 20
    return s
  }
  return [...pool].sort((a, b) => score(b) - score(a))[0]
}

async function speakBrowser(text) {
  try {
    const synth = window.speechSynthesis
    if (!synth || !text) return
    synth.cancel()
    if (!cachedVoice) cachedVoice = pickVoice(await getVoicesAsync())
    const u = new SpeechSynthesisUtterance(text)
    u.lang = (cachedVoice && cachedVoice.lang) || 'en-US'
    u.rate = 0.96
    if (cachedVoice) u.voice = cachedVoice
    synth.speak(u)
  } catch {
    /* no-op */
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
