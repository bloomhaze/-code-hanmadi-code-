import { supabase } from './supabase.js'

// 사용자가 저장한 표현 — Supabase 'saved_items' 테이블(RLS: 본인 것만).
//   type: 'word' | 'phrase' | 'sentence'
//   term: 영어 단어/표현/문장
//   data: { kr, ex, exKr } (word/phrase) 또는 { ko } (sentence)

export async function listMySaved() {
  const { data, error } = await supabase
    .from('saved_items')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((r) => ({ id: r.id, type: r.type, term: r.term, ...(r.data || {}) }))
}

export async function addSaved({ type, term, data }) {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth?.user?.id
  if (!uid) throw new Error('not logged in')
  const { error } = await supabase
    .from('saved_items')
    .insert({ user_id: uid, type, term, data: data || {} })
  if (error) throw error
}

export async function removeSaved(id) {
  const { error } = await supabase.from('saved_items').delete().eq('id', id)
  if (error) throw error
}
