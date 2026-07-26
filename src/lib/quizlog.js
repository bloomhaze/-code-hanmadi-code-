import { supabase } from './supabase.js'

// 퀴즈 완료 기록 — Supabase 'quiz_results' 테이블(RLS: 본인 것만).
//   count: 이번 세션에서 복습한 문항 수, correct: 맞힌 수
export async function saveQuizResult({ count, correct }) {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth?.user?.id
  if (!uid) return
  const { error } = await supabase
    .from('quiz_results')
    .insert({ user_id: uid, count: count || 0, correct: correct || 0 })
  if (error) throw error
}

// 총 복습 표현 수 = 모든 세션의 문항 수 합계
export async function reviewedCount() {
  const { data, error } = await supabase.from('quiz_results').select('count')
  if (error) throw error
  return (data || []).reduce((s, r) => s + (r.count || 0), 0)
}
