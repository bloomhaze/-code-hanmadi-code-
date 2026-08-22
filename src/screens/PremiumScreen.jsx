import { useState } from 'react'
import feedbackUrl from '../assets/feedback.svg'
import { TERMS_URL, PRIVACY_URL } from '../data/legal.js'

// 프리미엄 구독 화면 — 연간/월간 선택 + 혜택 + 결제 CTA.
// ⚠️ 실제 결제(PG/인앱결제)는 아직 미연동 — '구독하기'는 안내 토스트로 연결.
const PLANS = {
  yearly: { label: '연간', price: '1년 69,000원', unit: '월 ', unitBold: '4,917원', unitTail: '으로 영어공부', cta: '연간 구독하기' },
  monthly: { label: '월간', price: '1개월 7,900원', unit: '하루 ', unitBold: '160원', unitTail: '으로 영어공부', cta: '월간 구독하기' },
}

const BENEFITS = [
  { t: '자연스러운 음성', d: '원어민처럼 자연스러운 발음과 억양으로 들어보세요' },
  { t: '무제한 복습 퀴즈', d: '내가 쓴 일기 속 표현과 문장으로 무제한 복습해요' },
  { t: '무제한 표현 저장', d: '50개 제한 없이, 표현을 마음껏 모아 복습해요' },
]

function CheckCircle() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="shrink-0">
      <circle cx="11" cy="11" r="11" fill="#0066ff" />
      <path d="M6.3 11.3l3 3 6.3-6.8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function PremiumScreen({ onBack, onToast }) {
  const [plan, setPlan] = useState('yearly')
  const cur = PLANS[plan]
  const isYearly = plan === 'yearly'

  const PlanCard = ({ id }) => {
    const p = PLANS[id]
    const selected = plan === id
    return (
      <button
        type="button"
        onClick={() => setPlan(id)}
        className="relative flex-1 rounded-[18px] py-3.5"
        style={selected ? { background: '#fff', boxShadow: 'inset 0 0 0 2px #121212' } : { background: '#f4f4f5' }}
      >
        {id === 'yearly' && (
          <span className="absolute -top-2.5 left-3 rounded-full bg-wrong px-2 py-[3px] font-sans text-[11px] font-bold text-white">
            27% 할인
          </span>
        )}
        <div className="flex flex-col items-center gap-1">
          <span className="font-sans text-[13px] text-muted">{p.label}</span>
          <span className="font-sans text-[17px] font-bold text-ink" style={{ letterSpacing: '-.3px' }}>
            {p.price}
          </span>
        </div>
      </button>
    )
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white">
      {/* top bar */}
      <div className="flex h-12 shrink-0 items-center justify-between px-5 pt-4">
        <button type="button" onClick={onBack} className="flex h-8 w-8 items-center justify-center" aria-label="닫기">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4l12 12M16 4L4 16" stroke="#121212" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <button type="button" onClick={() => onToast?.('구매 복원 기능은 결제 도입 후 제공돼요')} className="px-1 py-0.5">
          <span className="font-sans text-[15px] font-medium text-ink" style={{ letterSpacing: '-.2px' }}>
            구매 복원
          </span>
        </button>
      </div>

      {/* scroll content */}
      <div className="no-scrollbar relative flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-4">
        {/* 장식 일러스트 (좌상단, 살짝 걸쳐서) */}
        <img
          src={feedbackUrl}
          alt=""
          className="pointer-events-none absolute -left-3 top-1 w-[112px] -rotate-6 opacity-95"
        />

        {/* title */}
        <div className="mt-6 flex flex-col items-center gap-2.5 text-center">
          <h1 className="font-sans text-[26px] font-bold text-ink" style={{ letterSpacing: '-.6px' }}>
            한마디 프리미엄
          </h1>
          <p
            className="whitespace-pre-line font-sans text-[15px] font-light text-muted"
            style={{ lineHeight: '22px', letterSpacing: '-.2px' }}
          >
            {'나의 생각, 나의 일상을\n기록하면 영어는 따라올거에요'}
          </p>
        </div>

        {/* plan selector */}
        <div className="mt-9 flex gap-2.5">
          <PlanCard id="yearly" />
          <PlanCard id="monthly" />
        </div>
        {/* 선택한 플랜의 환산 문구 — 선택 카드 쪽으로 정렬 */}
        <p className={`mt-2.5 font-sans text-[14px] text-ink ${isYearly ? 'text-left' : 'text-right'}`}>
          {cur.unit}
          <span className="font-bold">{cur.unitBold}</span>
          {cur.unitTail}
        </p>

        {/* benefits */}
        <div className="mt-6 flex flex-col gap-5 rounded-[20px] bg-[#f6f6f7] px-5 py-6">
          {BENEFITS.map((b) => (
            <div key={b.t} className="flex gap-3">
              <CheckCircle />
              <div className="flex flex-col gap-1.5">
                <span className="font-sans text-[16px] font-bold text-ink" style={{ letterSpacing: '-.3px' }}>
                  {b.t}
                </span>
                <span className="font-sans text-[13px] font-light text-muted" style={{ lineHeight: '18px' }}>
                  {b.d}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* fine print + links (내용이 짧으면 아래로 밀어 붙임) */}
        <div className="mt-auto pt-7">
          <p
            className="whitespace-pre-line text-center font-sans text-[12px] font-light text-muted-2"
            style={{ lineHeight: '18px' }}
          >
            {'구독은 현재 기간 종료 최소 24시간 전에 취소하지 않으면 자동 갱신됩니다.\nApp store 설정에서 언제든지 구독을 관리하고 취소할 수 있습니다.'}
          </p>
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => window.open(TERMS_URL, '_blank', 'noopener,noreferrer')}
              className="font-sans text-[12px] font-light text-muted-2 underline underline-offset-2"
            >
              서비스 약관
            </button>
            <span className="px-1 font-sans text-[12px] font-light text-muted-2">및</span>
            <button
              type="button"
              onClick={() => window.open(PRIVACY_URL, '_blank', 'noopener,noreferrer')}
              className="font-sans text-[12px] font-light text-muted-2 underline underline-offset-2"
            >
              개인정보 처리방침
            </button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="shrink-0 px-5 pb-7 pt-2">
        <button
          type="button"
          onClick={() => onToast?.('결제 기능은 곧 제공될 예정이에요')}
          className="flex h-[54px] w-full items-center justify-center rounded-[18px]"
          style={{ background: '#0066ff' }}
        >
          <span className="font-sans text-[16px] font-bold text-white" style={{ letterSpacing: '-.3px' }}>
            {cur.cta}
          </span>
        </button>
      </div>
    </div>
  )
}
