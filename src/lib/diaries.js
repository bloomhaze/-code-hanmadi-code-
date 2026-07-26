import { supabase } from './supabase.js'

// 사용자가 실제로 저장한 일기 — Supabase 'diaries' 테이블(RLS: 본인 것만).
// 저장 payload: WriteScreen 결과(data) + 원문(body) + 모드(ko/en) + 제목(날짜)

export function todayTitle(d = new Date()) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

export async function saveDiary({ mode, body, data, title }) {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth?.user?.id
  if (!uid) throw new Error('not logged in')
  const { error } = await supabase.from('diaries').insert({
    user_id: uid,
    mode,
    body: body || '',
    title: title || todayTitle(),
    data: data || {},
  })
  if (error) throw error
}

export async function listMyDiaries() {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(toEntry)
}

export async function deleteDiary(id) {
  const { error } = await supabase.from('diaries').delete().eq('id', id)
  if (error) throw error
}

// DB row → DiaryScreen/DiaryDetailScreen 이 쓰는 엔트리 형태로 변환
function toEntry(r) {
  const isEn = r.mode === 'en'
  const d = r.data || {}
  const sentences = Array.isArray(d.sentences) ? d.sentences : []
  const c = r.created_at ? new Date(r.created_at) : new Date()
  return {
    id: r.id,
    real: true,
    date: r.title || '',
    title: r.title || '',
    // 달력 매칭용 날짜 키 (로컬 기준 YYYY-M-D)
    dateKey: `${c.getFullYear()}-${c.getMonth() + 1}-${c.getDate()}`,
    lang: isEn ? 'EN' : 'KR',
    correction: isEn,
    sentences,
    allKo: d.allKo || '',
    allEn: d.allEn || '',
    preview: (isEn ? d.allEn : d.allKo) || '',
  }
}
