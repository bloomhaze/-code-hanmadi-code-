import { supabase } from './supabase.js'

// 영어 문장을 소리내어 읽어준다 (듣기 버튼).
// speak(text, onEnd): 재생이 끝나면 onEnd() 호출 → 버튼 자동 off 용.
// 1순위: Azure Neural TTS(원어민급) — smooth-worker의 tts 액션(+Storage 캐시).
//   응답은 { url }(캐시 파일) 또는 { audio(base64), mime }.
// 실패 시: 브라우저 내장 음성 중 가장 자연스러운 것으로 폴백.
let currentAudio = null
let gen = 0 // 재생 세대 — 새 재생/정지 때마다 증가시켜 이전 요청을 무효화
const urlCache = new Map() // text -> 재생용 URL

function stopCurrent() {
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

export function stopSpeak() {
  gen++ // 진행 중이던 재생 무효화
  stopCurrent()
}

function b64ToUrl(b64, mime) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: mime || 'audio/mpeg' }))
}

function playUrl(url, onEnd, myGen) {
  stopCurrent()
  if (gen !== myGen) return
  const a = new Audio(url)
  currentAudio = a
  const done = () => {
    if (gen === myGen) onEnd?.()
  }
  a.onended = done
  a.onerror = done
  a.play().catch(() => {})
}

export async function speak(text, onEnd) {
  const t = String(text || '').trim()
  if (!t) return
  const myGen = ++gen // 새 재생 시작 → 이전 것 무효화
  stopCurrent()
  if (urlCache.has(t)) {
    playUrl(urlCache.get(t), onEnd, myGen)
    return
  }
  try {
    const { data, error } = await supabase.functions.invoke('smooth-worker', {
      body: { action: 'tts', text: t },
    })
    if (gen !== myGen) return // 그 사이 정지/다른 재생됨
    if (error) throw new Error('invoke error')
    if (data?.error) throw new Error(data.error)
    const url = data?.url || (data?.audio ? b64ToUrl(data.audio, data.mime) : null)
    if (!url) throw new Error('no audio')
    urlCache.set(t, url)
    playUrl(url, onEnd, myGen)
  } catch {
    if (gen !== myGen) return
    speakBrowser(t, onEnd, myGen)
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

function speakBrowser(text, onEnd, myGen) {
  try {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    const doSpeak = (voice) => {
      if (gen !== myGen) return
      const u = new SpeechSynthesisUtterance(text)
      u.lang = (voice && voice.lang) || 'en-US'
      u.rate = 0.96
      if (voice) u.voice = voice
      u.onend = () => {
        if (gen === myGen) onEnd?.()
      }
      synth.speak(u)
    }
    if (cachedVoice) doSpeak(cachedVoice)
    else getVoicesAsync().then((vs) => { cachedVoice = pickVoice(vs); doSpeak(cachedVoice) })
  } catch {
    /* no-op */
  }
}
