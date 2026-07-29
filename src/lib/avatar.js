import { supabase } from './supabase.js'

// 프로필 사진 업로드 — Storage 'avatars' 버킷(public)에 올리고 public URL을 돌려준다.
// 경로: <userId>/<timestamp>.<ext> (RLS: user_id 폴더 기준 정책 권장)
export async function uploadAvatar(file) {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth?.user?.id
  if (!uid) throw new Error('로그인이 필요해요')

  const rawExt = (file.name?.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const ext = rawExt || (file.type?.split('/')[1] || 'jpg')
  const path = `${uid}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('avatars').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || undefined,
  })
  if (error) throw error

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}
