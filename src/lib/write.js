import { supabase } from './supabase.js'
import { diffSegs } from './diffSeg.js'

// 일기 번역(한글→영어) / 교정(영어) — Supabase Edge Function(smooth-worker)의
// Groq AI를 호출해 SentenceResult가 렌더할 수 있는 형태로 변환한다.
//   mode 'ko' → 번역:  { sentences: [{ ko, en }], allKo, allEn }
//   mode 'en' → 교정:  { sentences: [{ correction, ko, enSegs, fixSegs }], allKo, allEn }
export async function translateOrCorrect(text, mode) {
  const action = mode === 'en' ? 'correct' : 'translate'
  const { data, error } = await supabase.functions.invoke('smooth-worker', {
    body: { action, text },
  })
  if (error) throw new Error(error.message || 'invoke error')
  if (data?.error) throw new Error(data.error)
  if (!Array.isArray(data?.sentences) || data.sentences.length === 0) {
    // 함수가 아직 번역/교정을 지원 안 하면 채점 형식({ok,feedback})이 돌아온다.
    throw new Error(
      data && 'ok' in data
        ? '함수가 아직 번역/교정 버전이 아니에요. smooth-worker를 새 코드로 재배포해주세요.'
        : '결과 형식 오류',
    )
  }

  if (action === 'translate') {
    const sentences = data.sentences.map((s) => ({ ko: s.ko || '', en: s.en || '' }))
    return withAll({ sentences }, 'translate')
  }

  // correct → 원문/교정문 diff로 하이라이트 세그먼트 생성.
  // 바뀐 부분이 하나도 없으면 '완벽하게 쓴 문장'으로 표시(perfect).
  const sentences = data.sentences.map((s) => {
    const original = s.original || ''
    const corrected = s.corrected || original
    const { enSegs, fixSegs } = diffSegs(original, corrected)
    const perfect = !fixSegs.some((g) => g.kind === 'f') && !enSegs.some((g) => g.kind === 'w')
    return { correction: true, perfect, ko: s.ko || '', en: corrected, enSegs, fixSegs }
  })
  return withAll({ sentences }, 'correct')
}

// 교정 사유 설명 — 빨간(고쳐진) 부분을 탭하면 왜 그렇게 고쳤는지 AI가 설명한다.
// original/corrected 문장 전체와 탭한 부분(phrase)을 넘겨 문맥에 맞는 설명을 받는다.
export async function explainFix(phrase, original, corrected) {
  const { data, error } = await supabase.functions.invoke('smooth-worker', {
    body: { action: 'explain', phrase, original, corrected },
  })
  if (error) throw new Error(error.message || 'invoke error')
  if (data?.error) throw new Error(data.error)
  return (data?.reason || '').trim()
}

function withAll(result, mode) {
  const segText = (segs) => segs.map((g) => g.t).join('')
  result.allKo = result.sentences.map((s) => s.ko).join(' ')
  result.allEn = result.sentences
    .map((s) => (mode === 'correct' ? segText(s.fixSegs) : s.en))
    .join(' ')
  return result
}
