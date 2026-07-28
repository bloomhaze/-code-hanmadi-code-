import { supabase } from './supabase.js'

// 단어 검색 — 검색한 한국어(또는 영어) 표현을 Supabase Edge Function(smooth-worker)의
// Groq AI에 보내, 원어민이 실제로 많이 쓰는 영어 표현 1~5개(빈도순)를 받는다.
// 각 항목: { term, kr, ex, exKr }
export async function searchExpressions(query) {
  const q = (query || '').trim()
  if (!q) return []
  const { data, error } = await supabase.functions.invoke('smooth-worker', {
    body: { action: 'search', query: q },
  })
  if (error) throw new Error(error.message || 'invoke error')
  if (data?.error) throw new Error(data.error)
  return (Array.isArray(data?.results) ? data.results : [])
    .map((r) => ({
      term: (r.term || '').trim(),
      kr: (r.kr || '').trim(),
      ex: (r.ex || '').trim(),
      exKr: (r.exKr || '').trim(),
    }))
    .filter((r) => r.term)
}
