// Supabase Edge Function: grade-writing
// 학습자의 영작을 AI로 채점한다.
// 기준(엄격): 의미가 통하고 + 문법이 모두 정확하고 + 철자가 모두 정확하면 ok=true.
//            문법/철자 오류가 하나라도 있으면 무조건 ok=false.
//            (영어는 다양한 표현이 가능하므로 참고 정답과 표현이 달라도 위 조건을 만족하면 정답)
//
// 배포: Supabase 대시보드 Edge Functions → Deploy via Editor, 함수명 grade-writing
// 키 설정(아래 중 하나 — Gemini가 무료 티어라 추천): Secrets 에 등록
//   GEMINI_API_KEY     (Google AI Studio, 무료)
//   ANTHROPIC_API_KEY  (유료)
//   OPENAI_API_KEY     (유료)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function buildPrompt(ko: string, answer: string, model: string) {
  return (
    '너는 매우 엄격한 영어 첨삭 선생님이야. 학습자가 한국어 문장을 영어로 작문했어.\n' +
    '평가 기준:\n' +
    '- (1) 의미가 통하고(한국어 뜻을 제대로 전달) + (2) 문법이 모두 정확하고 + (3) 철자가 모두 정확하면 ok=true.\n' +
    '- 문법 오류나 철자 오류가 하나라도 있으면 무조건 ok=false.\n' +
    '- 영어는 다양한 표현이 가능하니, 참고 정답과 표현/어휘가 달라도 위 세 조건을 만족하면 ok=true.\n' +
    '- 대소문자, 관사(a/the), 단수/복수, 시제, 전치사 오류도 문법 오류로 본다.\n' +
    '한국어 문장: ' + ko + '\n' +
    '학습자 영작: ' + answer + '\n' +
    '참고 정답(DB): ' + model + '\n' +
    '반드시 아래 JSON만 반환해: {"ok": true 또는 false, "feedback": "한국어로 1~2문장 피드백 (틀렸다면 무엇이 틀렸는지)"}'
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } })

  try {
    const { ko = '', answer = '', model = '' } = await req.json()
    if (!answer.trim()) return json({ ok: false, feedback: '내용을 입력해주세요.' })

    const prompt = buildPrompt(ko, answer, model)
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    let content = ''

    if (geminiKey) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0, responseMimeType: 'application/json' },
          }),
        },
      )
      const j = await r.json().catch(() => ({}))
      // Gemini 오류를 화면 피드백에 그대로 노출해서 원인을 바로 확인한다.
      if (!r.ok) {
        const msg = j?.error?.message || JSON.stringify(j).slice(0, 300)
        return json({ ok: false, feedback: `AI 오류(${r.status}): ${msg}` })
      }
      content = j?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      if (!content) {
        return json({ ok: false, feedback: 'AI 응답이 비었어요: ' + JSON.stringify(j).slice(0, 300) })
      }
    } else if (anthropicKey) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-latest',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const j = await r.json()
      content = j?.content?.[0]?.text || ''
    } else if (openaiKey) {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const j = await r.json()
      content = j?.choices?.[0]?.message?.content || ''
    } else {
      return json({ error: 'no LLM key configured (set GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY)' }, 500)
    }

    let data: { ok?: boolean; feedback?: string }
    try {
      data = JSON.parse(content)
    } catch {
      const m = content.match(/\{[\s\S]*\}/)
      data = m ? JSON.parse(m[0]) : { ok: false, feedback: '채점 응답을 해석하지 못했어요.' }
    }
    return json({ ok: !!data.ok, feedback: data.feedback || '' })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
