// Supabase Edge Function: grade-writing (Groq 무료 채점)
// 학습자의 영작을 AI로 채점한다.
// 기준(엄격): 의미가 통하고 + 문법이 모두 정확하고 + 철자가 모두 정확하면 ok=true.
//            문법/철자 오류가 하나라도 있으면 무조건 ok=false.
//            (영어는 다양한 표현이 가능하므로 참고 정답과 표현이 달라도 위 조건을 만족하면 정답)
//
// 키 설정(Secrets): GROQ_API_KEY  (console.groq.com, 무료, 카드 불필요)

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

    const groqKey = Deno.env.get('GROQ_API_KEY')
    if (!groqKey) return json({ ok: false, feedback: 'GROQ_API_KEY가 설정되지 않았어요.' })

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: buildPrompt(ko, answer, model) }],
      }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) {
      const msg = j?.error?.message || JSON.stringify(j).slice(0, 300)
      return json({ ok: false, feedback: `AI 오류(${r.status}): ${msg}` })
    }
    const content = j?.choices?.[0]?.message?.content || ''
    if (!content) return json({ ok: false, feedback: 'AI 응답이 비었어요: ' + JSON.stringify(j).slice(0, 300) })

    let data: { ok?: boolean; feedback?: string }
    try {
      data = JSON.parse(content)
    } catch {
      const m = content.match(/\{[\s\S]*\}/)
      data = m ? JSON.parse(m[0]) : { ok: false, feedback: '채점 응답 해석 실패: ' + content.slice(0, 200) }
    }
    return json({ ok: !!data.ok, feedback: data.feedback || '' })
  } catch (e) {
    return json({ ok: false, feedback: '서버 오류: ' + String(e) })
  }
})
