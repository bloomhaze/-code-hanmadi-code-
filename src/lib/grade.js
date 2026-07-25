import { supabase } from './supabase.js'

// 영작 채점 — Supabase Edge Function(grade-writing)의 AI 채점을 호출한다.
// 함수 미배포/네트워크 오류 시에는 "저장 정답과 정확히 일치할 때만 정답"인
// 엄격한 폴백으로 처리한다(오답을 정답으로 통과시키지 않기 위해).
export async function gradeWriting(cur, answer) {
  const model = cur?.kind === 'sentence' ? cur.term : cur?.ex || cur?.term || ''
  const ko = cur?.ko || cur?.exKr || cur?.kr || ''

  try {
    const { data, error } = await supabase.functions.invoke('grade-writing', {
      body: { ko, answer, model },
    })
    if (error || !data || typeof data.ok !== 'boolean') throw error || new Error('bad grade response')
    return {
      ok: data.ok,
      better: model, // "이렇게도 쓸 수 있어요" / "모범 답안" = 저장 데이터 기반 문장
      feedback: data.feedback || (data.ok ? '' : '문법·철자를 다시 확인해보세요.'),
    }
  } catch {
    return strictFallback(answer, model)
  }
}

// AI 미사용 시: 정규화 후 완전 일치만 정답. (변형은 불허하지만 오답 오통과는 막음)
function strictFallback(answer, model) {
  const norm = (s) =>
    (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  const ok = norm(answer) === norm(model) && norm(answer).length > 0
  return {
    ok,
    better: model,
    feedback: ok ? '' : '문법·철자를 다시 확인해보세요.',
  }
}
