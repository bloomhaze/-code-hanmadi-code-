import { useState } from 'react'

const CheckBadge = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="10" fill="#0066ff" />
    <path d="M6 10.2l2.6 2.6L14.2 7.2" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const FEATURES = [
  { title: '무제한 복습 퀴즈', desc: '내가 쓴 일기 속 표현과 문장으로 무제한 복습해요' },
  { title: '영어로 작성하고 AI 교정', desc: '영어로 써보고 가장 자연스럽게 AI가 첨삭해줘요' },
  { title: '무제한 표현 저장', desc: '30개 제한 없이, 표현을 마음껏 모아 복습해요' },
]

// 한마디 프리미엄 — plan selector, features, subscribe CTA.
export default function PremiumScreen({ onClose, onToast }) {
  const [plan, setPlan] = useState('annual')
  const [letterOpen, setLetterOpen] = useState(false)
  const annual = plan === 'annual'

  return (
    <div
      className="absolute inset-0 z-40 bg-white"
      style={{ animation: 'sheetUp .34s cubic-bezier(.22,1,.36,1)' }}
    >
      {/* top bar */}
      <div className="absolute left-0 top-12 z-20 flex h-14 w-full items-center justify-between px-5">
        <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="#121212" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <button type="button" onClick={() => onToast?.('구매 내역을 확인하고 있어요')}>
          <span className="font-sans text-[15px] font-medium text-ink">구매 복원</span>
        </button>
      </div>

      {/* content */}
      <div className="no-scrollbar absolute left-0 top-[104px] h-[640px] w-full overflow-y-auto">
        {/* floating letter */}
        <button
          type="button"
          onClick={() => setLetterOpen(true)}
          className="absolute left-[-8px] top-5 z-[3] h-[130px] w-[130px]"
          style={{ animation: 'letterFloat 3.2s ease-in-out infinite' }}
        >
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <rect x="20" y="34" width="80" height="58" rx="10" fill="#fff" stroke="#dbe7ff" strokeWidth="2" />
            <path d="M22 40l38 26 38-26" stroke="#9cc0ff" strokeWidth="2" fill="none" strokeLinecap="round" />
            <circle cx="88" cy="34" r="13" fill="#0066ff" />
            <path d="M83 34l3.4 3.4L93 30" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="relative z-[2] flex flex-col items-center px-5 pb-[130px] pt-5">
          <span className="font-sans text-[24px] font-bold text-ink" style={{ letterSpacing: '-.5px' }}>
            한마디 프리미엄
          </span>
          <span
            className="mt-3 text-center font-sans text-[14px] font-light text-muted"
            style={{ lineHeight: '22px' }}
          >
            나의 생각, 나의 일상으로
            <br />
            시작하는 영어공부
          </span>

          {/* plan selector */}
          <div className="mt-8 flex flex-row gap-[11px] self-stretch">
            <button
              type="button"
              onClick={() => setPlan('annual')}
              className="relative flex h-[68px] flex-1 flex-col items-center justify-center gap-1.5 rounded-[20px] bg-[#f7f7f8]"
              style={{ boxShadow: annual ? 'inset 0 0 0 2px #121212' : 'none' }}
            >
              <div className="absolute left-3.5 top-[-11px] flex h-[22px] items-center rounded-lg bg-[#ff4242] px-2">
                <span className="font-sans text-[12px] font-medium text-white">21% 할인</span>
              </div>
              <span className="font-sans text-[13px] font-normal text-muted" style={{ letterSpacing: '-.2px' }}>
                연간
              </span>
              <span className="font-inter text-[18px] font-semibold text-ink" style={{ letterSpacing: '-.4px' }}>
                1년 59,000원
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPlan('monthly')}
              className="flex h-[68px] flex-1 flex-col items-center justify-center gap-1.5 rounded-[20px] bg-[#f7f7f8]"
              style={{ boxShadow: annual ? 'none' : 'inset 0 0 0 2px #121212' }}
            >
              <span className="font-sans text-[13px] font-normal text-muted" style={{ letterSpacing: '-.2px' }}>
                월간
              </span>
              <span className="font-inter text-[18px] font-semibold text-ink" style={{ letterSpacing: '-.4px' }}>
                1개월 6,900원
              </span>
            </button>
          </div>

          {/* sub price line */}
          <div className="mt-3 flex self-stretch" style={{ justifyContent: annual ? 'flex-start' : 'flex-end' }}>
            <span
              className="text-center font-sans text-[13px] font-light text-ink"
              style={{ width: 162, letterSpacing: '-.2px' }}
            >
              <span className="font-semibold" style={{ color: '#0167FF' }}>
                {annual ? '월 4,917원' : '하루 160원'}
              </span>
              으로 영어공부
            </span>
          </div>

          {/* features */}
          <div className="mt-5 flex flex-col gap-[22px] self-stretch rounded-3xl bg-[#f7f7f8] px-[22px] py-[26px]">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <CheckBadge />
                  <span className="font-sans text-[18px] font-semibold text-ink" style={{ letterSpacing: '-.3px' }}>
                    {f.title}
                  </span>
                </div>
                <span
                  className="pl-7 font-sans text-[14px] font-light text-muted"
                  style={{ lineHeight: '20px', letterSpacing: '-.2px' }}
                >
                  {f.desc}
                </span>
              </div>
            ))}
          </div>

          <span
            className="mt-11 text-center font-sans text-[12px] font-normal"
            style={{ color: '#b0b0b0', lineHeight: '18px', letterSpacing: '-.2px' }}
          >
            구독은 현재 기간 종료 최소 24시간 전에 취소하지 않으면 자동 갱신됩니다. App store 설정에서 언제든지
            구독을 관리하고 취소할 수 있습니다.
          </span>
          <button
            type="button"
            onClick={() => onToast?.('이용 약관 및 개인정보 처리방침')}
            className="mt-2 font-sans text-[12px] font-normal"
            style={{ color: '#b0b0b0', letterSpacing: '-.2px' }}
          >
            이용 약관 및 개인정보 처리방침
          </button>
        </div>
      </div>

      {/* bottom CTA (with white backing so scrolled text sits beneath it) */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 z-[10] h-[110px] w-full"
        style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0) 0%,#fff 34%)' }}
      />
      <button
        type="button"
        onClick={() => onToast?.(annual ? '연간 구독을 시작할게요' : '월간 구독을 시작할게요')}
        className="absolute bottom-[34px] left-5 z-[11] flex h-[50px] w-[335px] items-center justify-center rounded-[20px]"
        style={{ background: '#0066ff' }}
      >
        <span className="font-sans text-[16px] font-medium text-white" style={{ letterSpacing: '-.3px' }}>
          {annual ? '연간 구독하기' : '월간 구독하기'}
        </span>
      </button>

      {/* developer letter popup */}
      {letterOpen && (
        <div
          className="absolute inset-0 z-[60] flex items-center justify-center px-7"
          style={{ background: 'rgba(0,0,0,.4)', animation: 'fadeIn .2s ease' }}
          onClick={() => setLetterOpen(false)}
        >
          <div
            className="box-border flex max-h-[560px] w-full flex-col rounded-3xl bg-white px-6 pb-[30px] pt-5"
            style={{ animation: 'letterUnfold .3s cubic-bezier(.22,1,.36,1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex justify-end">
              <button
                type="button"
                onClick={() => setLetterOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1f1f2]"
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="#8a8a8a" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div
              className="no-scrollbar flex flex-col gap-3.5 overflow-y-auto font-sans text-[15px] font-normal"
              style={{ lineHeight: '24px', letterSpacing: '-.2px', color: '#2e2f33' }}
            >
              <span className="whitespace-pre-line">
                안녕하세요{'\n'}한마디를 만들고 있는 개발자입니다.
              </span>
              <span>영어 공부는 오래 했는데, 막상 간단한 문장도 영어로 어떻게 말해야 할 지 모르겠던 적 있으셨나요?</span>
              <span>
                저도 영어를 잘하고 싶어서 여러 공부법을 시도해 봤지만, 가장 효과를 본 방법은 영어 일기를 꾸준히 쓰는
                것이었습니다.
              </span>
              <span>
                매일 내가 있었던 일과 생각들을 영어로 적고, 표현을 익히다보니 한마디라도 내뱉을 수 있었던, 그래서 조금씩
                자신감이 붙었던 저의 경험을 그대로 담아 한마디를 만들게되었습니다.
              </span>
              <span>써보시고 도움이 되었다면, 영어 공부의 여정을 한마디와 함께해요 :)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
