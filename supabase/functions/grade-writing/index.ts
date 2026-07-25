// Supabase Edge Function: smooth-worker (Groq 무료 AI)
// action 으로 네 가지를 처리한다:
//   'grade'     — 작문 퀴즈 채점        body: { action, ko, answer, model }          → { ok, feedback }
//   'translate' — 일기 한글→영어 번역   body: { action, text }                       → { sentences: [{ ko, en }] }
//   'correct'   — 영어 일기 교정        body: { action, text }                       → { sentences: [{ ko, original, corrected }] }
//   'explain'   — 교정 사유 설명        body: { action, original, corrected, phrase } → { reason }
//
// 키 설정(Secrets): GROQ_API_KEY  (console.groq.com, 무료, 카드 불필요)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GROQ_MODEL = 'llama-3.3-70b-versatile'

async function callGroq(key: string, prompt: string): Promise<{ data?: any; error?: string }> {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
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
    '너는 한국어 일기를 자연스러운 원어민 영어로 번역하는 번역가야.\n' +
    '아래 일기를 문장 단위로 나누고, 각 문장을 자연스럽고 문법적으로 정확한 영어로 번역해.\n' +
    '일기:\n' + text + '\n' +
    '반드시 이 JSON만 반환: {"sentences": [{"ko": "원문 한국어 문장", "en": "English translation"}]}'
  )
}

function correctPrompt(text: string) {
  return (
    '너는 영어 첨삭 선생님이야. 학습자가 영어로 일기를 썼어.\n' +
    '아래 일기를 문장 단위로 나누고, 각 문장마다 다음을 제공해:\n' +
    '- ko: 그 문장의 한국어 뜻\n' +
    '- original: 학습자가 쓴 원문 그대로\n' +
    '- corrected: 문법·철자·자연스러움을 고친 버전 (이미 완벽하면 original과 동일하게)\n' +
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } })

  try {
    const body = await req.json()
    const action = body.action || 'grade'
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

    const text = (body.text || '').trim()
    if (!text) return json({ error: '내용을 입력해주세요.' })

    if (action === 'translate') {
      const { data, error } = await callGroq(key, translatePrompt(text))
      if (error) return json({ error })
      return json({ sentences: Array.isArray(data.sentences) ? data.sentences : [] })
    }
    if (action === 'correct') {
      const { data, error } = await callGroq(key, correctPrompt(text))
      if (error) return json({ error })
      return json({ sentences: Array.isArray(data.sentences) ? data.sentences : [] })
    }
    return json({ error: 'unknown action' })
  } catch (e) {
    return json({ error: String(e) })
  }
})
