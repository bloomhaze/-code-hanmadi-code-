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
  if (error || !data || !Array.isArray(data.sentences) || data.sentences.length === 0) {
    throw error || new Error('bad write response')
  }

  if (action === 'translate') {
    const sentences = data.sentences.map((s) => ({ ko: s.ko || '', en: s.en || '' }))
    return withAll({ sentences }, 'translate')
  }

  // correct → 원문/교정문 diff로 하이라이트 세그먼트 생성
  const sentences = data.sentences.map((s) => {
    const original = s.original || ''
    const corrected = s.corrected || original
    const { enSegs, fixSegs } = diffSegs(original, corrected)
    return { correction: true, ko: s.ko || '', enSegs, fixSegs }
  })
  return withAll({ sentences }, 'correct')
}

function withAll(result, mode) {
  const segText = (segs) => segs.map((g) => g.t).join('')
  result.allKo = result.sentences.map((s) => s.ko).join(' ')
  result.allEn = result.sentences
    .map((s) => (mode === 'correct' ? segText(s.fixSegs) : s.en))
    .join(' ')
  return result
}
