// 영어 문장을 소리내어 읽어준다 (듣기 버튼).
// 브라우저 내장 Web Speech를 쓰되, 기기에 있는 음성 중 가장 자연스러운
// (Natural/Neural/Online 계열, en-US 우선) 음성을 골라 최대한 원어민처럼 들리게 한다.
// ※ 크롬/엣지 최신 브라우저엔 무료 뉴럴 음성이 포함되어 있어 품질이 크게 좋아진다.
let current = null

// 음성 목록은 비동기로 로드될 수 있어 한 번 기다렸다가 고른다.
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

// en-US 우선, 이름에 자연스러운 엔진 키워드가 있으면 가점.
function pickVoice(voices) {
  const enUS = voices.filter((v) => /^en[-_]?US/i.test(v.lang))
  const pool = enUS.length ? enUS : voices.filter((v) => /^en/i.test(v.lang))
  if (!pool.length) return null
  const score = (v) => {
    const n = (v.name || '').toLowerCase()
    let s = 0
    if (/natural|neural|enhanced|premium/.test(n)) s += 100
    if (/online/.test(n)) s += 60
    if (v.localService === false) s += 30 // 온라인(서버) 음성이 대체로 더 자연스러움
    if (/google/.test(n)) s += 40
    if (/microsoft/.test(n)) s += 25
    if (/samantha|aria|jenny|ava|allison|emma|zoe|siri|natasha/.test(n)) s += 20
    return s
  }
  return [...pool].sort((a, b) => score(b) - score(a))[0]
}

let cachedVoice = null

export async function speak(text) {
  const t = String(text || '').trim()
  try {
    const synth = window.speechSynthesis
    if (!synth || !t) return
    synth.cancel()
    if (!cachedVoice) {
      const voices = await getVoicesAsync()
      cachedVoice = pickVoice(voices)
    }
    const u = new SpeechSynthesisUtterance(t)
    u.lang = (cachedVoice && cachedVoice.lang) || 'en-US'
    u.rate = 0.96
    u.pitch = 1
    if (cachedVoice) u.voice = cachedVoice
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
