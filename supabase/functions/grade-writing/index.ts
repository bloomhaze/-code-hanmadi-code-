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

async function callGroq(
  key: string,
  prompt: string,
  model: string = GROQ_MODEL,
  temperature = 0,
): Promise<{ data?: any; error?: string }> {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature,
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

// 한국어 출력 필드 보호 — 화이트리스트 방식.
// 한글·영문·숫자·공백·일반 문장부호만 남기고, 그 외 모든 언어(태국어·아랍어·한자·가나·키릴 등)를 강제 제거.
// 허용: 0-9 A-Za-z, 한글(AC00-D7A3, 자모 1100-11FF/3130-318F/A960-A97F/D7B0-D7FF),
//       공백, 일반 문장부호(2010-205E 각종 대시·따옴표·… 포함), 기본 ASCII 부호, 도(°)/가운뎃점(·)
const KEEP_SRC =
  "0-9A-Za-z\\uAC00-\\uD7A3\\u1100-\\u11FF\\u3130-\\u318F\\uA960-\\uA97F\\uD7B0-\\uD7FF" +
  "\\s.,!?'\"()\\[\\]{}:;~\\-/%&@#*+=<>\\u00B0\\u00B7\\u2010-\\u205E"
function stripForeign(s: string): string {
  return (s || '').replace(new RegExp('[^' + KEEP_SRC + ']', 'g'), '').replace(/\s{2,}/g, ' ').trim()
}
function hasForeign(s: string): boolean {
  return new RegExp('[^' + KEEP_SRC + ']').test(s || '')
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
    `너는 전문 원어민 영어 작가이자 에디터야. 한국어를 "축자 번역"하는 게 아니라, ` +
    `영어권에서 교육받은 20~30대 원어민이 처음부터 영어로 쓴 것처럼 다시 써(rewrite). ` +
    `아래 규칙을 엄격히 지켜. 결과물은 번역티가 절대 나면 안 되고, 원어민이 원래 영어로 쓴 글처럼 읽혀야 해.\n` +
    `\n` +
    `[최상위 목표] 자연스러움·유창함·리듬·감정의 진정성을 우선하되, 원문이 말하는 "사실·행위·상태"는 절대 바꾸지 마. ` +
    `자연스러움을 핑계로 원문에 없는 감정·기대·해석을 덧붙이거나, 담백한 사실 서술을 감정 표현으로 바꾸는 "오버 의역"은 금지.\n` +
    `\n` +
    `규칙1. 단어가 아니라 "의미"를 옮겨라. 한국어 문장 구조를 보존하지 말고, 의도를 먼저 이해한 뒤 영어로 자연스럽게 다시 써. 필요하면 어순을 완전히 바꿔.\n` +
    `규칙2. 진짜 원어민처럼 써라. 개인 일기·SNS·블로그·대화에서 실제로 쓰는 표현을 사용. 교과서 영어·번역투 금지.\n` +
    `규칙3. 감정을 보존하라. 답답함/실망/설렘/불안/고마움/그리움 등 원래 감정 톤을 그대로 살려. 로봇처럼 쓰지 마.\n` +
    `규칙4. 흐름을 살려라. 문장별로 옮기지 말고 아이디어를 자연스럽게 연결. 원어민이라면 합칠 문장은 합치고, 나눌 긴 문장은 나눠.\n` +
    `규칙5. 자연스러운 연어(collocation)를 써라. 예: make a good first impression, heat and humidity, cooler climate, ` +
    `replay the interview in my head, stay calm, feel defeated, can't help but. 문법은 맞지만 잘 안 쓰는 어색한 조합은 피해.\n` +
    `규칙6. 구어적으로. 교육받은 미국인이 실제로 말하는 방식 선호: It just occurred to me..., To be honest..., ` +
    `I can't help feeling..., What really gets to me is..., On top of that..., I keep thinking about... (지나치게 격식적인 표현 대신).\n` +
    `규칙7. 불필요한 반복 제거. 한국어는 비슷한 말을 반복하기도 함 — 영어는 하나의 강한 문장으로 합쳐.\n` +
    `규칙8. 가독성. 문장 길이를 다양하게, 강조엔 짧은 문장. 모든 문장이 같은 리듬이 되지 않게.\n` +
    `규칙9. 설명하지 말고 보여줘라(show, don't tell). "I felt uncomfortable" 대신 "I was sweating even while standing still" 처럼 구체적으로.\n` +
    `규칙10. 원본처럼 들리게. 번역처럼 읽히면 실패. 원어민이 "원래 영어로 썼구나" 느껴야 함.\n` +
    `규칙11. 어려운 어휘 남발 금지. 일상 단어를 써. 인상적인 것보다 자연스러운 게 낫다.\n` +
    `규칙12. 직역이 어색하면 자유롭게 다시 써. 자연스러움 > 한국어 원문에 가깝게.\n` +
    `규칙13. 글쓴이의 성격 유지. 감정을 과장하지 말고, 원본보다 더 드라마틱하게 만들지 말고, 미묘한 감정도 없애지 마.\n` +
    `규칙14. 감정적으로 믿기게. 에세이가 아니라 진짜 자기 생각을 나누는 사람처럼.\n` +
    `규칙15. 오버 의역 금지(매우 중요). 원문의 사실·행위·상태를 임의로 다른 것으로 바꾸지 마. ` +
    `특히 담백한 사실 서술을 원문에 없는 감정으로 바꾸지 마. ` +
    `예: "계획중이다" → "are planning a trip"(O) / "are looking forward to a trip"(X — 원문에 없는 '기대·설렘'을 지어냄). ` +
    `예: "먹었다" → "had / ate"(O) / 원문에 특별한 뉘앙스가 없는데 "treated myself to"(X). ` +
    `원문에 실제로 담긴 감정만 살리고, 없는 감정은 만들지 마. 자연스럽게 다듬는 것과 내용을 바꾸는 건 다르다.\n` +
    `\n` +
    `[우선순위] 1)원문 사실·의도 보존 2)자연스러움 3)진정성 4)감정의 뉘앙스 5)원어민 연어 6)매끄러운 흐름 7)가독성. ` +
    `"어색한 직역"과 "원어민이 자연스럽게 쓸 법한 것" 중에선 후자를 택하되, 원문의 사실·행위·의도·감정을 바꾸거나 없던 걸 더하지는 마.\n` +
    `단, 문법·관사·시제·전치사·철자는 원어민 수준으로 정확히. 없던 새 사건을 지어내진 말고 이미 담긴 감정만 자연스럽게 확장해.\n` +
    `한국 음식·문화 용어는 영어권 통용 표현으로(sashimi, tteokbokki, kimchi 등).\n` +
    `\n` +
    `[참고 예시 — 이 수준이 목표]\n` +
    `입력: "오늘 남자친구랑 모듬회를 먹었다. 갑자기 약속을 잡고 갔는데 너무 맛있어서 기분이좋았다"\n` +
    `좋은(O): "Today, my boyfriend and I went out for an assorted sashimi platter. It was a spontaneous plan, but the food was so good that it put me in a great mood."\n` +
    `나쁜(X): "Today I ate mixed raw fish dish with my boyfriend. We made a sudden plan and went, and it was so delicious that I felt good." (콩글리쉬·직역 — 절대 금지)\n` +
    `입력: "여유로운 마음을 가지고 해야하는데 막상 내가 준비했던 것보다 답변을 못해서 아쉽고, 자괴감이 든다."\n` +
    `좋은(O): "I wanted to stay calm and relaxed, but once the interview started, I didn't answer the questions as well as I had during my preparation. I'm disappointed in myself, and I can't help feeling a bit defeated."\n` +
    `\n` +
    `[난이도 예시 — 딱 이 정도 "쉽고 담백한" 수준이 목표. 괜히 어렵거나 화려하게 꼬지 마]\n` +
    `입력: "내가 가장 싫어하는 계절은 여름이다. 한국의 여름은 굉장히 습하고 덥다. 가만히 있어도 땀이 줄줄 흐르고, 진이 빠진다. ` +
    `좀 웃기지만, 항상 여름이 오기 전에 두려움이 크다. 이번 여름은 또 얼마나 더울까? 매년 여름 한국을 떠나 추운 나라로 갈 돈이 있으면 좋겠다."\n` +
    `좋은(O): "My least favorite season is summer. Summers in Korea are incredibly hot and humid. ` +
    `Even if I'm just standing still, I end up drenched in sweat, and it completely drains my energy. ` +
    `It might sound a little funny, but I always feel a sense of dread before summer arrives. ` +
    `I can't help but wonder, 'How hot is it going to be this year?' ` +
    `Sometimes I find myself wishing I had enough money to escape to a colder country every summer in Korea."\n` +
    `나쁜(X, 너무 어렵게 꼰 예): "Korean summers are brutally humid and scorching. Even sitting still, sweat streams down my back. ` +
    `I keep running into the question of just how scorching this summer will turn out to be." ` +
    `← 이렇게 어려운 단어(brutally, scorching)와 과하게 꼬인 구문은 피하고, 위 좋은(O)처럼 쉽고 담백하게.\n` +
    `\n` +
    `[출력 구조 — 매우 중요] 우리 앱은 단어 탭 기능 때문에 "원문 한국어 문장(ko) ↔ 자연스러운 영어(en)" 쌍이 필요해. ` +
    `각 ko(원문 한국어 문장)마다 en을 주되, en은 그 한 문장만 축자로 옮기는 게 아니라 위 규칙대로 원어민답게 다시 쓴 결과여야 해. ` +
    `en은 여러 문장이어도 되고, 흐름을 위해 접속사로 이어도 돼(To be honest, but once ~, On top of that 등).\n` +
    `각 문장마다 제공:\n` +
    `- ko: 원문 한국어 문장\n` +
    `- en: 위 규칙 수준의 자연스러운 원어민 영어\n` +
    `- phrases: 그 en 문장 안에 등장하는 아래 종류를, en에 나타난 표면형(철자·활용형) 그대로, 하나도 빠짐없이 배열로 담아.\n` +
    `    (1) 구동사(phrasal verb) = "동사 + 부사(up/out/off/on/down/into/over/away/back/around/along...)". ` +
    `문장에 있는 모든 구동사를 활용된 형태 그대로 넣어. ` +
    `예: run into, running into, streams down, sneaks up, turned out, turn out, break out, figured out, wears me out, cheer me up, ` +
    `catch up on, come across, look forward to, give up\n` +
    `    (2) 관용/이디엄 및 자주 쓰는 연어(collocation): piece of cake, break the ice, under the weather, once in a while, ` +
    `on the same page, mind goes blank, a wave of dread, get a wave of, make a good first impression, a sense of relief, ` +
    `end up, let it go\n` +
    `    (3) 하나의 뜻으로 굳어진 전치사·부사 표현: at the last minute, in the meantime, out of nowhere, on purpose, for a while, all of a sudden, by the way, in advance, at least, as soon as, in the end, a couple of, make my day\n` +
    `  ★ 매우 중요: 구동사(동사+부사)는 문장에 보이는 즉시 반드시 통째로 넣어. streams, down 처럼 따로 넣지 마. 활용형(streams down, sneaks up)도 그대로.\n` +
    `  ★ "at the last minute"/"a wave of dread" 같은 표현도 통째로 한 덩어리로. at, the, last, minute 처럼 쪼개지 마.\n` +
    `  ★ 분리형 구동사는 동사가 활용된 형태 그대로, 문장에 나타난 전체 구간을 넣어: "tried it out", "wears me out", "cheer me up" (X: 기본형 "wear out"만 넣기).\n` +
    `  단어 하나짜리는 넣지 말고, 두 단어 이상 묶여야 뜻이 통하는 표현만. 없으면 빈 배열 [].\n` +
    `일기:\n${text}\n` +
    `반드시 이 JSON만 반환: {"sentences": [{"ko": "...", "en": "...", "phrases": ["..."]}]}`
  )
}

function correctPrompt(text: string) {
  return (
    '너는 원어민 영어 첨삭 선생님이야. 학습자가 영어로 일기를 썼어. ' +
    'ChatGPT 수준으로 자연스럽고 세련된 영어로 다듬어줘야 해.\n' +
    '★ 교정 원칙(매우 중요):\n' +
    '- 문법·철자 오류는 하나도 빠짐없이 정확히 고쳐.\n' +
    '- 문법은 맞지만 어색하거나 콩글리쉬한 표현은, 원어민이 실제로 쓰는 자연스럽고 매끄러운 표현으로 다듬어. ' +
    '밋밋한 표현(I was happy, it was good)은 더 생생한 원어민 표현으로.\n' +
    '- 필요하면 어순을 바꾸거나 접속사(but, so, and, that)로 문장을 자연스럽게 이어도 돼.\n' +
    '- 어휘는 원어민이 일상에서 자주 쓰는 쉽고 흔한 단어를 우선해. 문어적·잘 안 쓰는 어려운 단어(linger, commence, utilize 등)는 피하고 ' +
    '더 쉬운 표현(is still there, start, use 등)으로 바꿔.\n' +
    '- 단, 학습자의 원래 의도·의미는 반드시 유지해 (내용을 바꾸거나 새 사실을 덧붙이지 마).\n' +
    '- 셀 수 있는 명사가 특정 한 개가 아니라 일반적인 의미로 쓰이면 자연스러운 복수형으로 고쳐. ' +
    '예: "eat honey butter chip" → "eat honey butter chips", "buy chip" → "buy some chips". ' +
    '한 개를 콕 집는 맥락이 아니면 "a chip"보다 "chips"를 선호해.\n' +
    '- 일관성: 같은 일기 안에서 같은 대상을 가리키는 명사는 문장마다 표기를 통일해 ' +
    '(한 문장은 "chips", 다른 문장은 "a chip"처럼 섞지 마).\n' +
    '- 원문이 이미 맞으면 단순 축약형 변환은 하지 마(억지 교정 금지). ' +
    '예: "I will"↔"I\'ll", "it is"↔"it\'s", "do not"↔"don\'t", "I am"↔"I\'m"는 원래 표현이 맞으면 그대로 둬. ' +
    '이런 걸 바꾸면 맞는 표현에 오류 표시(취소선)가 붙어 학습자가 헷갈려. 실제 오류나 어색함이 있을 때만 고쳐.\n' +
    '- 이미 문법·철자·표현이 모두 정확하고 자연스러우면 corrected를 original과 똑같이 둬 (억지 교정 금지).\n' +
    '\n' +
    '★ 참고 예시(이 수준으로 다듬어):\n' +
    'original: "Today I eat mixed raw fish with my boyfriend. It was very delicious so I feel good."\n' +
    'corrected: "Today, my boyfriend and I had an assorted sashimi platter. ' +
    'It was so delicious that it really made my day."\n' +
    '\n' +
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
    '★ reason은 반드시 100% 한국어(한글)로만. 예로 드는 영어 단어를 제외하고 ' +
    '일본어·중국어(한자)·기타 외국 문자를 절대 섞지 마.\n' +
    '반드시 이 JSON만 반환: {"reason": "한국어 설명"}'
  )
}

function searchPrompt(query: string) {
  return (
    '너는 영어 표현 사전이야. 학습자가 한국어 단어나 표현을 검색했어. ' +
    '그 뜻을 영어로 말할 때 원어민이 "실제로 가장 많이 쓰는" 표현을 사용 빈도가 높은 순서로 최대 5개(최소 1개) 뽑아줘.\n' +
    '검색어: "' + query + '"\n' +
    '요구사항:\n' +
    '- 가장 흔하고 자연스러운 표현이 1위, 그 다음으로 자주 쓰는 순서로 정렬.\n' +
    '- 억지로 5개 채우지 말고, 정말 자주 쓰는 것만. 뜻이 거의 같아도 뉘앙스가 다르면 포함 가능.\n' +
    '- 각 표현마다:\n' +
    '  - term: 영어 표현(구동사/숙어면 통째로). 예: "have an interview", "go for an interview"\n' +
    '  - kr: 그 표현의 한국어 뜻(짧게). 뉘앙스 차이가 있으면 살짝 덧붙여.\n' +
    '  - ex: 그 표현을 그 형태 그대로 포함하는, 일상에서 자주 쓸 법한 자연스러운 예문 1개.\n' +
    '  - exKr: 그 예문의 한국어 번역.\n' +
    '- 검색어가 영어면 그대로 영어 표현으로 다뤄도 돼.\n' +
    '★ kr, exKr은 반드시 100% 한국어(한글)로만 작성해. term/ex의 영어 표현을 제외하고, ' +
    '일본어·중국어(한자)·기타 외국 문자를 절대 섞지 마. 예: "忘れた"(X) → "잊어버렸다"(O).\n' +
    '반드시 이 JSON만 반환: {"results": [{"term": "...", "kr": "...", "ex": "...", "exKr": "..."}]}'
  )
}

function wordPrompt(word: string, sentence: string) {
  return (
    '너는 영어 학습자를 위한 친절한 영어 사전이야. 학습자가 문장에서 단어(또는 표현)를 탭했어.\n' +
    (sentence ? '문장(문맥): ' + sentence + '\n' : '') +
    '단어/표현: "' + word + '"\n' +
    '요구사항:\n' +
    '★ 가장 중요: kr(뜻)은 반드시 "위 문장 속에서 이 단어가 실제로 쓰인 의미(문맥 의미)"를 골라야 해. ' +
    '사전 대표 뜻만 나열하지 말고, 이 문맥에 맞는 뜻을 최우선으로 써. ' +
    '문맥과 안 맞는 대표 뜻은 쓰지 마.\n' +
    '  예: "Even when I\'m sitting still, I break out in sweat and it feels miserable." 문맥의 miserable ' +
    '→ "(형용사) (기분이) 찝찝한, 불쾌한, 괴로운"(O) / "비참한, 불행한"(X, 이 문맥엔 안 맞음).\n' +
    '  예: "I ran into an old friend." 문맥의 run into → "우연히 마주치다"(O) / "~에 들이받다"(X).\n' +
    '★ 표현이 여러 단어면(숙어·연어), 표현 전체의 뜻을 "정확하고 완전하게" 담아. 핵심 단어를 빠뜨리지 마. ' +
    '예: "get a wave of dread" → "(표현) 두려움이 밀려오다, 갑자기 두려워지다"(O) / "갑자기 느끼게 되는"(X, dread=두려움을 빠뜨림). ' +
    '품사 괄호는 실제에 맞게: 단어면 (동사)/(형용사)/(명사), 여러 단어면 (구동사)/(숙어)/(표현) 등.\n' +
    '- kr: 위 문맥 의미를 앞에 품사를 괄호로 붙여 써. 예: "(형용사) 찝찝한, 불쾌한"\n' +
    '- ex: 위 단어/표현("' + word + '")을 그 철자·형태 그대로 반드시 포함하는 예문 1개. ' +
    '위 문맥과 "같은 의미"로 쓰인, 일상에서 자주 쓸 법한 쉽고 자연스러운 대화체 문장으로 만들어. ' +
    '절대 파생어나 다른 형태로 바꾸지 마 (예: whole→wholeheartedly, run→running 금지). 구동사면 그 구동사를 통째로 사용해.\n' +
    '- exKr: 그 예문의 한국어 번역\n' +
    '★ kr, exKr은 반드시 100% 한국어(한글)로만 작성해. ex(영어 예문) 안의 그 영어 표현을 제외하고, ' +
    '일본어·중국어(한자)·기타 외국 문자를 절대 섞지 마. 예: "忘れた"(X) → "잊어버렸다"(O).\n' +
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
      return json({ reason: stripForeign(data.reason || '') })
    }

    if (action === 'word') {
      const word = (body.word || '').trim()
      if (!word) return json({ error: '단어가 없어요.' })
      let { data, error } = await callGroq(key, wordPrompt(word, (body.sentence || '').trim()))
      // 한글·영어 외 언어(태국어·한자 등)가 섞이면 SMART_MODEL로 한 번 재시도(품질↑), 그래도 남으면 코드에서 제거
      if (!error && (hasForeign(data.kr) || hasForeign(data.ex) || hasForeign(data.exKr))) {
        const retry = await callGroq(key, wordPrompt(word, (body.sentence || '').trim()), SMART_MODEL, 0.2)
        if (!retry.error) data = retry.data
      }
      if (error) return json({ error })
      return json({ kr: stripForeign(data.kr || ''), ex: stripForeign(data.ex || ''), exKr: stripForeign(data.exKr || '') })
    }

    if (action === 'search') {
      const q = (body.query || body.text || '').trim()
      if (!q) return json({ error: '검색어가 없어요.' })
      // 자연스러운 표현이 필요해 SMART_MODEL + temperature 0.3, 실패 시 llama 폴백.
      let r = await callGroq(key, searchPrompt(q), SMART_MODEL, 0.3)
      if (r.error) r = await callGroq(key, searchPrompt(q), GROQ_MODEL, 0.3)
      if (r.error) return json({ error: r.error })
      const results = (Array.isArray(r.data.results) ? r.data.results.slice(0, 5) : []).map((it: any) => ({
        term: stripForeign(it.term || ''),
        kr: stripForeign(it.kr || ''),
        ex: stripForeign(it.ex || ''),
        exKr: stripForeign(it.exKr || ''),
      }))
      return json({ results })
    }

    const text = (body.text || '').trim()
    if (!text) return json({ error: '내용을 입력해주세요.' })

    if (action === 'translate') {
      // 자연스러운 재구성은 필요하되 오버 의역을 줄이려 temperature 0.45. gpt-oss 실패 시 llama 폴백.
      let r = await callGroq(key, translatePrompt(text), SMART_MODEL, 0.45)
      if (r.error) r = await callGroq(key, translatePrompt(text), GROQ_MODEL, 0.45)
      if (r.error) return json({ error: r.error })
      const sentences = (Array.isArray(r.data.sentences) ? r.data.sentences : []).map((s: any) => ({
        ...s,
        ko: stripForeign(s.ko || ''), // 한국어 원문 필드에 한자 등 혼입 방지
      }))
      return json({ sentences })
    }
    if (action === 'correct') {
      let r = await callGroq(key, correctPrompt(text), SMART_MODEL, 0.4)
      if (r.error) r = await callGroq(key, correctPrompt(text), GROQ_MODEL, 0.4)
      if (r.error) return json({ error: r.error })
      const sentences = (Array.isArray(r.data.sentences) ? r.data.sentences : []).map((s: any) => ({
        ...s,
        ko: stripForeign(s.ko || ''), // 한국어 뜻 필드에 한자 등 혼입 방지
      }))
      return json({ sentences })
    }
    return json({ error: 'unknown action' })
  } catch (e) {
    return json({ error: String(e) })
  }
})
