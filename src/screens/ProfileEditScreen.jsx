import { useState } from 'react'
import { ProfileAvatar } from '../components/icons.jsx'

// 프로필 편집 — 아바타(+편집 뱃지) / 닉네임 수정 / 저장.
export default function ProfileEditScreen({ name = '', avatarUrl = '', onBack, onSave, onToast }) {
  const [nick, setNick] = useState(name)
  const [broken, setBroken] = useState(false)
  const [saving, setSaving] = useState(false)
  const trimmed = nick.trim()
  const canSave = !!trimmed && !saving

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave?.(trimmed)
      onBack?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white">
      {/* top bar */}
      <div className="flex h-12 shrink-0 items-center justify-between px-5 pt-4">
        <button type="button" onClick={onBack} className="flex h-6 w-6 items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15.7589 4.23695C16.0817 4.55288 16.0817 5.0651 15.7589 5.38103L8.9964 12L15.7589 18.619C16.0817 18.9349 16.0817 19.4471 15.7589 19.7631C15.4361 20.079 14.9128 20.079 14.59 19.7631L7.24306 12.572C6.92028 12.2561 6.92028 11.7439 7.24306 11.428L14.59 4.23695C14.9128 3.92102 15.4361 3.92102 15.7589 4.23695Z"
              fill="#121212"
            />
          </svg>
        </button>
        <button type="button" onClick={save} disabled={!canSave} className="px-1">
          <span
            className="font-sans text-[16px] font-semibold"
            style={{ color: canSave ? '#121212' : '#c4c4c4', letterSpacing: '-.3px' }}
          >
            저장
          </span>
        </button>
      </div>

      {/* content */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5">
        {/* avatar + edit badge */}
        <div className="mt-4 flex justify-center">
          <div className="relative h-[96px] w-[96px]">
            <div className="h-[96px] w-[96px] overflow-hidden rounded-full">
              {avatarUrl && !broken ? (
                <img
                  src={avatarUrl}
                  alt="프로필"
                  referrerPolicy="no-referrer"
                  onError={() => setBroken(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ProfileAvatar size={96} />
              )}
            </div>
            {/* 편집 뱃지 */}
            <button
              type="button"
              onClick={() => onToast?.('준비 중이에요')}
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-white"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,.18)' }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M11.5 2.5a1.5 1.5 0 0 1 2.12 2.12l-7.3 7.3-2.82.7.7-2.82 7.3-7.3Z"
                  stroke="#8a8a8a"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 닉네임 */}
        <div className="mt-8 flex flex-col gap-2">
          <span className="px-1 font-sans text-[13px] font-medium" style={{ color: '#9b9b9b', letterSpacing: '-.2px' }}>
            닉네임
          </span>
          <input
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            maxLength={20}
            placeholder="닉네임을 입력해주세요"
            className="h-[52px] rounded-2xl bg-[#f7f7f7] px-[18px] font-sans text-[16px] text-ink outline-none placeholder:text-[#b0b0b0]"
            style={{ letterSpacing: '-.3px', boxShadow: 'inset 0 0 0 1px transparent' }}
          />
        </div>
      </div>
    </div>
  )
}
