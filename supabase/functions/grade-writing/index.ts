// Supabase Edge Function: smooth-worker (Groq 무료 AI)
// action 으로 다섯 가지를 처리한다:
//   'grade'     — 작문 퀴즈 채점        body: { action, ko, answer, model }          → { ok, feedback }
//   'translate' — 일기 한글→영어 번역   body: { action, text }                       → { sentences: [{ ko, en }] }
//   'correct'   — 영어 일기 교정        body: { action, text }                       → { sentences: [{ ko, original, corrected }] }
//   'explain'   — 교정 사유 설명        body: { action, original, corrected, phrase } → { reason }
//   'word'      — 단어 뜻/예문          body: { action, word, sentence }             → { kr, ex, exKr }
//   'tts'       — 음성 합성(원어민)+캐시  body: { action, text, voice }                → { url } (또는 { audio, mime })
//
// 키 설정(Secrets):
//   GROQ_API_KEY          (console.groq.com — 채점/번역/교정/단어)
//   AZURE_SPEECH_KEY      (Azure Speech 리소스 KEY 1 — 원어민 TTS)
//   AZURE_SPEECH_REGION   (예: eastus)
// 캐시 저장소: Supabase Storage에 public 버킷 'tts-cache' 를 미리 만들어 두세요.
//   (같은 문장은 1번만 생성해 저장하고, 이후엔 저장된 mp3를 재생 → 비용 0)

const AZURE_VOICE = 'en-US-JennyNeural' // 자연스러운 여성 원어민 (Aria/Emma 등으로 교체 가능)
const TTS_BUCKET = 'tts-cache'

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

async function sha256hex(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Azure Neural TTS — 텍스트를 mp3 바이트로.
async function azureTTS(text: string, voice: string): Promise<{ audio?: Uint8Array; error?: string }> {
  const key = Deno.env.get('AZURE_SPEECH_KEY')
  const region = Deno.env.get('AZURE_SPEECH_REGION')
  if (!key || !region) return { error: 'AZURE_SPEECH_KEY/REGION이 설정되지 않았어요.' }
  const ssml =
    `<speak version='1.0' xml:lang='en-US'><voice xml:lang='en-US' name='${voice}'>${xmlEscape(text)}</voice></speak>`
  const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'hanmadi',
    },
    body: ssml,
  })
  if (!r.ok) {
    const tx = await r.text().catch(() => '')
    return { error: `Azure TTS 오류(${r.status}): ${tx.slice(0, 160)}` }
  }
  return { audio: new Uint8Array(await r.arrayBuffer()) }
}

function u8ToBase64(buf: Uint8Array) {
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < buf.length; i += chunk) bin += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + chunk)))
  return btoa(bin)
}

// 캐시(Storage) 우선 → 없으면 Azure로 생성 후 저장. 저장 실패 시 base64로 즉시 재생.
async function ttsCached(text: string, voice: string): Promise<{ url?: string; audio?: string; mime?: string; error?: string }> {
  const supaUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const path = `${await sha256hex(voice + '|' + text)}.mp3`
  const publicUrl = supaUrl ? `${supaUrl}/storage/v1/object/public/${TTS_BUCKET}/${path}` : ''

  // 1) 캐시 확인
  if (publicUrl) {
    try {
      const head = await fetch(publicUrl, { method: 'HEAD' })
      if (head.ok) return { url: publicUrl }
    } catch { /* ignore */ }
  }
  // 2) 생성
  const res = await azureTTS(text, voice)
  if (res.error || !res.audio) return { error: res.error || 'TTS 실패' }
  // 3) 저장(업서트)
  if (supaUrl && serviceKey) {
    try {
      const up = await fetch(`${supaUrl}/storage/v1/object/${TTS_BUCKET}/${path}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${serviceKey}`, 'content-type': 'audio/mpeg', 'x-upsert': 'true' },
        body: res.audio,
      })
      if (up.ok) return { url: publicUrl }
    } catch { /* ignore */ }
  }
  // 저장 못 하면(버킷 없음 등) 이번 오디오만 base64로 반환 → 재생은 됨
  return { audio: u8ToBase64(res.audio), mime: 'audio/mpeg' }
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GROQ_MODEL = 'llama-3.3-70b-versatile'
const SMART_MODEL = 'openai/gpt-oss-120b' // 번역·교정 등 품질이 중요한 작업용 (Groq 무료)

async function callGroq(key: string, prompt: string, model: string = GROQ_MODEL): Promise<{ data?: any; error?: string }> {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) return { error: `AI 오류(${r.status}): ${j?.error?.message || JSON.stringify(j).slice(0, 200)}` }
  const content = j?.choices?.[0]?.message?.content || ''
  if (!content) return { error: 'AI 응답이 비었어요.' }
  try {
    return { data: JSON.parse(content) }
  } catch {
    const m = content.match(/\{[\s\S]*\}/)
    if (m) {
      try {
        return { data: JSON.parse(m[0]) }
      } catch {
        /* fall through */
      }
    }
    return { error: '응답 해석 실패' }
  }
}

function gradePrompt(ko: string, answer: string, model: string) {
  return (
    '너는 매우 엄격한 영어 첨삭 선생님이야. 학습자가 한국어 문장을 영어로 작문했어.\n' +
    '평가 기준:\n' +
    '- (1) 의미가 통하고 + (2) 문법이 모두 정확하고 + (3) 철자가 모두 정확하면 ok=true.\n' +
    '- 문법 오류나 철자 오류가 하나라도 있으면 무조건 ok=false.\n' +
    '- 영어는 다양한 표현이 가능하니, 참고 정답과 표현이 달라도 위 세 조건을 만족하면 ok=true.\n' +
    '- 대소문자, 관사(a/the), 단수/복수, 시제, 전치사 오류도 문법 오류로 본다.\n' +
    '한국어 문장: ' + ko + '\n학습자 영작: ' + answer + '\n참고 정답(DB): ' + model + '\n' +
    '반드시 이 JSON만 반환: {"ok": true/false, "feedback": "한국어 1~2문장 피드백"}'
  )
}

function translatePrompt(text: string) {
  return (
    '너는 한국어 일기를 "원어민이 실제로 말하는" 자연스러운 영어로 옮기는 원어민 번역가야.\n' +
    '★ 번역 원칙(매우 중요):\n' +
    '- 절대 단어 대 단어 직역하지 마. 문장의 의미·뉘앙스를 파악해 원어민이 자기 일기에 쓸 법한 자연스럽고 구어적인 영어로 다시 써.\n' +
    '- 콩글리쉬/어색한 표현 금지. 예: "모듬회"→"assorted sashimi"(O) "mixed raw fish dish"(X), ' +
    '"약속을 잡고 갔는데"→"we met up"/"we made plans and went"(O) "made a sudden plan and went"(X).\n' +
    '- 한국 음식·문화 용어는 영어권 통용 표현으로(sashimi, tteokbokki, kimchi 등).\n' +
    '- 격식 빼고 친구한테 말하듯 캐주얼한 일기체. 대신 문법·관사·시제·전치사는 정확히.\n' +
    '- 필요하면 과감히 의역. "원어민이 이 상황을 어떻게 말할까?"를 최우선으로.\n' +
    '아래 일기를 문장 단위로 나누고, 각 문장마다 다음을 제공해:\n' +
    '- ko: 원문 한국어 문장\n' +
    '- en: 위 원칙에 따른 자연스러운 원어민 영어\n' +
    '- phrases: 그 en 문장 안에 등장하는 아래 두 종류를 en에 나타난 표면형(철자·활용형) 그대로 배열로 담아:\n' +
    '    (1) 구동사(phrasal verb) 예: run into, catch up on, come across, look forward to, give up\n' +
    '    (2) 관용 표현/이디엄(idiom) 예: piece of cake, break the ice, under the weather, once in a while, on the same page\n' +
    '  ★ 분리형 구동사(목적어가 동사와 부사 사이에 끼는 경우)는 문장에 나타난 전체 구간을 그대로 넣어. ' +
    '예: "tried it out", "picked it up", "turn it off", "figured it out" (X: "try out", "tried out")\n' +
    '  단어 하나짜리는 넣지 말고, 반드시 두 단어 이상으로 묶여야 뜻이 통하는 표현만. 없으면 빈 배열 [].\n' +
    '일기:\n' + text + '\n' +
    '반드시 이 JSON만 반환: {"sentences": [{"ko": "...", "en": "...", "phrases": ["..."]}]}'
  )
}

function correctPrompt(text: string) {
  return (
    '너는 원어민 영어 첨삭 선생님이야. 학습자가 영어로 일기를 썼어.\n' +
    '★ 교정 원칙(매우 중요):\n' +
    '- 문법·철자 오류는 하나도 빠짐없이 정확히 고쳐.\n' +
    '- 문법은 맞지만 어색하거나 콩글리쉬한 표현은, 원어민이 실제로 쓰는 자연스러운 표현으로 다듬어.\n' +
    '- 단, 학습자의 원래 의도·의미는 반드시 유지해 (내용을 바꾸거나 덧붙이지 마).\n' +
    '- 이미 문법·철자·표현이 모두 정확하고 자연스러우면 corrected를 original과 똑같이 둬 (억지 교정 금지).\n' +
    '아래 일기를 문장 단위로 나누고, 각 문장마다 다음을 제공해:\n' +
    '- ko: 그 문장의 한국어 뜻\n' +
    '- original: 학습자가 쓴 원문 그대로\n' +
    '- corrected: 위 원칙으로 고친 버전\n' +
    '일기:\n' + text + '\n' +
    '반드시 이 JSON만 반환: {"sentences": [{"ko": "...", "original": "...", "corrected": "..."}]}'
  )
}

function explainPrompt(original: string, corrected: string, phrase: string) {
  return (
    '너는 영어를 갓 배우기 시작한 학습자를 가르치는 친절한 영어 선생님이야.\n' +
    '학습자가 쓴 영어 문장을 네가 고쳐줬는데, 학습자가 특정 부분을 왜 고쳤는지 궁금해해.\n' +
    '학습자가 쓴 원문: ' + original + '\n' +
    '고쳐준 교정문: ' + corrected + '\n' +
    '학습자가 클릭한(고쳐진) 부분: "' + phrase + '"\n' +
    '요구사항:\n' +
    '- 그 부분이 문법이나 표현상 왜 어색/틀렸는지, 그리고 어떻게 고쳤는지 한국어로 설명해.\n' +
    '- 2~3문장으로 짧고 쉽게. 어려운 문법 용어는 최대한 풀어서 초보자도 이해할 수 있게.\n' +
    '- 딱딱하지 않고 다정하고 친근한 말투(~예요/~어요)로.\n' +
    '- 가능하면 바뀐 표현(예: goed → went)을 구체적으로 언급해.\n' +
    '반드시 이 JSON만 반환: {"reason": "한국어 설명"}'
  )
}

function wordPrompt(word: string, sentence: string) {
  return (
    '너는 영어 학습자를 위한 친절한 영어 사전이야. 학습자가 문장에서 단어(또는 표현)를 탭했어.\n' +
    (sentence ? '문장: ' + sentence + '\n' : '') +
    '단어/표현: "' + word + '"\n' +
    '요구사항:\n' +
    '- kr: 이 문맥에서의 한국어 뜻. 앞에 품사를 괄호로 붙여줘. 예: "(동사) 끌어들이다, 유치하다"\n' +
    '- ex: 위 단어/표현("' + word + '")을 그 철자·형태 그대로 반드시 포함하는 예문 1개. ' +
    '일상생활에서 실제로 자주 쓸 법한, 쉽고 자연스러운 대화체 문장으로 만들어 ' +
    '(전문적/딱딱한 상황 말고 친구·가족·일상 상황). ' +
    '절대 파생어나 다른 형태로 바꾸지 마 (예: whole→wholeheartedly, run→running 금지). 구동사면 그 구동사를 통째로 사용해.\n' +
    '- exKr: 그 예문의 한국어 번역\n' +
    '반드시 이 JSON만 반환: {"kr": "...", "ex": "...", "exKr": "..."}'
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } })

  try {
    const body = await req.json()
    const action = body.action || 'grade'

    // TTS / 계정삭제는 GROQ 키가 필요 없으니 먼저 처리.
    if (action === 'tts') {
      const t = (body.text || '').trim()
      if (!t) return json({ error: '읽을 내용이 없어요.' })
      const res = await ttsCached(t, body.voice || AZURE_VOICE)
      if (res.error) return json({ error: res.error })
      return json(res.url ? { url: res.url } : { audio: res.audio, mime: res.mime })
    }

    // 회원 탈퇴 — 요청자의 JWT로 본인 확인 후, 관리자 권한(service role)으로 계정 삭제.
    if (action === 'deleteAccount') {
      const supaUrl = Deno.env.get('SUPABASE_URL')
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
      if (!supaUrl || !serviceKey || !jwt) return json({ error: '인증 정보가 없어요.' }, 401)
      const ur = await fetch(`${supaUrl}/auth/v1/user`, {
        headers: { apikey: anonKey || serviceKey, Authorization: `Bearer ${jwt}` },
      })
      if (!ur.ok) return json({ error: '인증 실패 (다시 로그인 후 시도해주세요)' }, 401)
      const user = await ur.json().catch(() => null)
      if (!user?.id) return json({ error: '사용자를 찾을 수 없어요.' }, 401)
      const dr = await fetch(`${supaUrl}/auth/v1/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      })
      if (!dr.ok) {
        const tx = await dr.text().catch(() => '')
        return json({ error: `삭제 실패: ${tx.slice(0, 120)}` })
      }
      return json({ ok: true })
    }

    const key = Deno.env.get('GROQ_API_KEY')
    if (!key) return json({ error: 'GROQ_API_KEY가 설정되지 않았어요.' })

    if (action === 'grade') {
      const answer = (body.answer || '').trim()
      if (!answer) return json({ ok: false, feedback: '내용을 입력해주세요.' })
      const { data, error } = await callGroq(key, gradePrompt(body.ko || '', answer, body.model || ''))
      if (error) return json({ ok: false, feedback: error })
      return json({ ok: !!data.ok, feedback: data.feedback || '' })
    }

    if (action === 'explain') {
      const phrase = (body.phrase || '').trim()
      const original = (body.original || '').trim()
      const corrected = (body.corrected || '').trim()
      if (!phrase || !original) return json({ error: '설명할 내용이 부족해요.' })
      const { data, error } = await callGroq(key, explainPrompt(original, corrected, phrase))
      if (error) return json({ error })
      return json({ reason: data.reason || '' })
    }

    if (action === 'word') {
      const word = (body.word || '').trim()
      if (!word) return json({ error: '단어가 없어요.' })
      const { data, error } = await callGroq(key, wordPrompt(word, (body.sentence || '').trim()))
      if (error) return json({ error })
      return json({ kr: data.kr || '', ex: data.ex || '', exKr: data.exKr || '' })
    }

    const text = (body.text || '').trim()
    if (!text) return json({ error: '내용을 입력해주세요.' })

    if (action === 'translate') {
      let r = await callGroq(key, translatePrompt(text), SMART_MODEL)
      if (r.error) r = await callGroq(key, translatePrompt(text)) // gpt-oss 실패 시 llama 폴백
      if (r.error) return json({ error: r.error })
      return json({ sentences: Array.isArray(r.data.sentences) ? r.data.sentences : [] })
    }
    if (action === 'correct') {
      let r = await callGroq(key, correctPrompt(text), SMART_MODEL)
      if (r.error) r = await callGroq(key, correctPrompt(text)) // gpt-oss 실패 시 llama 폴백
      if (r.error) return json({ error: r.error })
      return json({ sentences: Array.isArray(r.data.sentences) ? r.data.sentences : [] })
    }
    return json({ error: 'unknown action' })
  } catch (e) {
    return json({ error: String(e) })
  }
})
