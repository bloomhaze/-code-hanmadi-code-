import { useState } from 'react'
import { ProfileAvatar, ChevronRightSmall, ExternalArrow } from '../components/icons.jsx'

const ACCENT = '#0066FF'

// 프로필 아바타 — 구글 프로필 사진이 있으면 그걸 쓰고, 없거나 로드 실패 시 기본 한마디 아바타.
function Avatar({ url }) {
  const [broken, setBroken] = useState(false)
  if (url && !broken) {
    return (
      <img
        src={url}
        alt="프로필"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="h-full w-full rounded-full object-cover"
      />
    )
  }
  return <ProfileAvatar />
}

// 마이페이지 — profile, stats, settings menu, premium entry.
export default function MyScreen({
  userName = '현진',
  email,
  avatarUrl = '',
  isGuest = false,
  onLogin,
  onProfile,
  onNotif,
  onFeedback,
  onPremium,
  onTerms,
  onPrivacy,
  onLogout,
  onWithdraw,
  onToast,
  diaryCount = 0,
  savedCount = 0,
  reviewedCount = 0,
}) {
  const displayName = userName.length <= 2 ? userName.split('').join(' ') : userName
  const displayEmail = email || 'svs9645@gmail.com'
  const vocabCount = savedCount

  const SectionLabel = ({ children }) => (
    <span
      className="px-1 font-sans text-[13px] font-medium"
      style={{ color: 'rgba(124,124,124,.61)', letterSpacing: '-.2px' }}
    >
      {children}
    </span>
  )

  const Row = ({ label, onClick, trailing, first, last, single }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[52px] w-full items-center px-[18px]"
      style={{
        borderBottom: last || single ? 'none' : '1px solid #eee',
        borderRadius: single ? 16 : first ? '16px 16px 0 0' : last ? '0 0 16px 16px' : 0,
      }}
    >
      <span className="flex-1 text-left font-sans text-[15px] text-ink" style={{ letterSpacing: '-.3px' }}>
        {label}
      </span>
      {trailing || <ChevronRightSmall />}
    </button>
  )

  return (
    <div className="flex h-full flex-col bg-white">
      {/* header */}
      <div className="flex h-12 shrink-0 items-center bg-white px-5 pt-4">
        <span className="font-sans text-[20px] font-semibold text-ink" style={{ letterSpacing: '-.4px' }}>
          마이페이지
        </span>
      </div>

      {/* content */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto bg-white">
        <div className="flex flex-col gap-6 px-5 pb-10 pt-3">
          {/* profile + stats */}
          {isGuest ? (
            /* 비회원 — 회원가입/로그인 유도 카드 (이름/통계 없음) */
            <button
              type="button"
              onClick={onLogin}
              className="flex items-center gap-3.5 rounded-[20px] bg-[#f7f7f7] p-[18px] text-left"
            >
              <div className="h-[54px] w-[54px] shrink-0">
                <ProfileAvatar mono />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center gap-1">
                  <span className="font-sans text-[17px] font-medium" style={{ color: '#121212', letterSpacing: '-.3px' }}>
                    회원가입 / 로그인
                  </span>
                  <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                    <path d="M6.75 4.5 11.25 9 6.75 13.5" stroke="#121212" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span
                  className="font-sans text-[13px] font-light"
                  style={{ color: '#7c7c7c', lineHeight: '19px', letterSpacing: '-.2px' }}
                >
                  로그인하고 한마디 다이어리를
                  <br />
                  자유롭게 이용해보세요
                </span>
              </div>
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onProfile}
                className="flex h-[100px] w-full items-center gap-3.5 rounded-[20px] bg-[#f7f7f7] p-[18px] text-left"
              >
                <div className="h-[54px] w-[54px] shrink-0 overflow-hidden rounded-full">
                  <Avatar url={avatarUrl} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <span className="font-sans text-[17px] font-semibold text-ink-2" style={{ letterSpacing: '-.3px' }}>
                    {displayName}
                  </span>
                  <span
                    className="truncate font-inter text-[13px] font-light"
                    style={{ color: '#8c8c8c', letterSpacing: '-.2px' }}
                  >
                    {displayEmail}
                  </span>
                  <span className="font-sans text-[13px] font-normal" style={{ color: ACCENT, letterSpacing: '-.2px' }}>
                    2026년 1월 8일 가입
                  </span>
                </div>
                <div className="flex shrink-0 items-center">
                  <ChevronRightSmall />
                </div>
              </button>

              <div className="flex flex-row gap-[9px]">
                {[
                  { label: '작성 일기', value: `${diaryCount}` },
                  { label: '저장 표현', value: `${vocabCount}` },
                  { label: '복습 표현', value: `${reviewedCount}` },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex h-[68px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl bg-[#f7f7f7]"
                  >
                    <span
                      className="whitespace-nowrap font-sans text-[12px] font-medium"
                      style={{ color: 'rgba(46,47,51,.61)', letterSpacing: '-.2px' }}
                    >
                      {s.label}
                    </span>
                    <span
                      className="whitespace-nowrap font-inter text-[18px] font-semibold text-ink-2"
                      style={{ letterSpacing: '-.5px' }}
                    >
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* menu sections */}
          <div className="flex flex-col gap-5">
            {/* 프리미엄 */}
            <div className="flex flex-col gap-2.5">
              <SectionLabel>프리미엄</SectionLabel>
              <button
                type="button"
                onClick={onPremium}
                className="flex h-[51px] items-center rounded-2xl px-[18px]"
                style={{ background: 'linear-gradient(90deg,#0066ff 0%,#21aaff 100%)' }}
              >
                <span
                  className="flex-1 text-left font-sans text-[15px] font-normal text-white"
                  style={{ letterSpacing: '-.3px' }}
                >
                  연간 / 월간 결제
                </span>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M6.75 4.5 11.25 9 6.75 13.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* 설정 */}
            <div className="flex flex-col gap-2.5">
              <SectionLabel>설정</SectionLabel>
              <div className="rounded-2xl bg-[#f7f7f8]">
                <Row label="알림 설정" onClick={onNotif} single />
              </div>
            </div>

            {/* 약관 및 지원 */}
            <div className="flex flex-col gap-2.5">
              <SectionLabel>약관 및 지원</SectionLabel>
              <div className="flex flex-col overflow-hidden rounded-2xl bg-[#f7f7f8]">
                <Row label="이용 약관" onClick={onTerms} first />
                <Row label="개인정보 처리" onClick={onPrivacy} />
                <Row label="개발자에게 한마디" onClick={onFeedback} last />
              </div>
            </div>

            {/* 인스타그램 */}
            <div className="flex flex-col gap-2.5">
              <SectionLabel>인스타그램</SectionLabel>
              <div className="rounded-2xl bg-[#f7f7f8]">
                <Row
                  label={<span className="font-inter">hanmadi.diary</span>}
                  onClick={() =>
                    window.open('https://www.instagram.com/hanmadi.diary/', '_blank', 'noopener,noreferrer')
                  }
                  trailing={<ExternalArrow />}
                  single
                />
              </div>
            </div>

            {/* logout / withdraw — 회원만 */}
            {!isGuest && (
            <div className="flex flex-row items-center gap-2.5 px-4">
              <button
                type="button"
                onClick={onLogout}
                className="font-sans text-[13px] text-ink"
                style={{ letterSpacing: '-.3px' }}
              >
                로그아웃
              </button>
              <div className="h-2.5 w-px bg-[#c4c4c4]" />
              <button
                type="button"
                onClick={onWithdraw}
                className="font-sans text-[13px]"
                style={{ color: '#ff4242', letterSpacing: '-.3px' }}
              >
                탈퇴
              </button>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
