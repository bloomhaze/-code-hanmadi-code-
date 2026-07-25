import { supabase } from './supabase.js'

// 단어 뜻/예문 — 탭한 단어와 그 문장을 Supabase Edge Function(smooth-worker)의
// Groq AI에 보내 WordPopup이 렌더할 형태로 받는다. { term, kr, ex, exKr }
export async function explainWord(term, sentence) {
  const { data, error } = await supabase.functions.invoke('smooth-worker', {
    body: { action: 'word', word: term, sentence: sentence || '' },
  })
  if (error) throw new Error(error.message || 'invoke error')
  if (data?.error) throw new Error(data.error)
  return {
    term,
    kr: (data?.kr || '').trim(),
    ex: (data?.ex || '').trim(),
    exKr: (data?.exKr || '').trim(),
  }
}
