import { useState } from 'react'
import LegalScreen from './LegalScreen.jsx'

const SLIDES = [
  {
    img: '/onboarding/ob-1.svg',
    title: '내 이야기로 배운 영어는\n더 오래 기억에 남아요.',
    desc: '오늘 있었던 일, 내 생각, 감정을\n한글과 영어로 기록해보세요',
  },
  {
    img: '/onboarding/ob-2.svg',
    title: '작성한 일기를 자연스럽게\n번역하고 교정해요.',
    desc: '한글로 작성하면 영어로 번역하고,\n영어로 작성하면 자연스럽게 첨삭해줘요',
  },
  {
    img: '/onboarding/ob-3.svg',
    title: '내 표현이 될 때까지\n무한 복습하세요.',
    desc: '내 일기 속 단어, 표현, 문장을\n다양한 방식으로 복습해요',
  },
  {
    img: '/onboarding/ob-4.svg',
    title: '매일 한마디, 영어 습관을 위해\n알림 보내드릴게요.',
    desc: '매일 하나의 표현이라도\n얻어가는데 크게 도움이 될거에요',
  },
]

// Apple 로그인은 App Store 출시 때 추가 예정 — 그전까지 화면에서 숨김.
const SHOW_APPLE = false

// 온보딩 — 로그인(auth) → 소개 4단계 → 완료(onComplete).
// onGoogle: start Supabase Google OAuth. Guest("먼저 둘러볼래요") goes to intro.
export default function OnboardingScreen({ onGoogle, onComplete, onToast }) {
  const [step, setStep] = useState('auth') // 'auth' | 1..4
  const [legal, setLegal] = useState(null) // 'terms' | 'privacy' | null

  const startIntro = () => setStep(1)
  const next = () => {
    if (step >= 4) onComplete?.()
    else setStep(step + 1)
  }

  if (step === 'auth') {
    return (
      <>
      <div className="no-scrollbar absolute inset-0 z-40 overflow-y-auto bg-white">
        <div className="relative mx-auto h-[812px] w-[375px] max-w-full">
        <div className="absolute left-[135px] top-[244px] h-[120px] w-[105px]">
          <img src="/brand/hanmadi-logo.svg" width="105" height="120" alt="한마디" />
        </div>

        <button
          type="button"
          onClick={onGoogle}
          className="absolute left-5 top-[489px] flex h-[50px] w-[335px] items-center justify-center gap-2 rounded-[20px] bg-white"
          style={{ boxShadow: 'inset 0 0 0 1px #ececee' }}
        >
          <img src="/brand/google-logo.svg" width="20" height="20" alt="" />
          <span className="font-sans text-[15px] font-medium text-ink" style={{ letterSpacing: '-.2px' }}>
            Google로 로그인
          </span>
        </button>
        {SHOW_APPLE && (
          <button
            type="button"
            onClick={startIntro}
            className="absolute left-5 top-[549px] flex h-[50px] w-[335px] items-center justify-center gap-2 rounded-[20px] bg-ink"
          >
            <img src="/brand/apple-logo.svg" width="20" height="20" alt="" />
            <span className="font-sans text-[15px] font-medium text-white" style={{ letterSpacing: '-.2px' }}>
              Apple로 로그인
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={startIntro}
          className="absolute left-0 flex w-full justify-center opacity-70"
          style={{ top: SHOW_APPLE ? 623 : 563 }}
        >
          <div className="flex items-center gap-1 border-b border-ink pb-0.5">
            <img src="/brand/eyes.svg" width="20" height="20" alt="" />
            <span className="font-sans text-[15px] font-medium text-ink" style={{ letterSpacing: '-.2px' }}>
              먼저 둘러볼래요
            </span>
          </div>
        </button>

        <div className="absolute left-5 top-[692px] flex w-[335px] justify-center text-center">
          <span
            className="font-sans text-[12px] font-normal"
            style={{ color: '#a0a0a0', lineHeight: '18px', letterSpacing: '-.2px' }}
          >
            로그인 시{' '}
            <button type="button" onClick={() => setLegal('terms')} className="underline underline-offset-2" style={{ color: '#7a7a7a' }}>
              이용약관
            </button>{' '}
            및{' '}
            <button type="button" onClick={() => setLegal('privacy')} className="underline underline-offset-2" style={{ color: '#7a7a7a' }}>
              개인정보처리방침
            </button>
            에
            <br />
            동의하는 것으로 간주됩니다
          </span>
        </div>
        </div>
      </div>
      {legal && <LegalScreen kind={legal} onBack={() => setLegal(null)} />}
      </>
    )
  }

  const slide = SLIDES[step - 1]
  return (
    <div className="no-scrollbar absolute inset-0 z-40 overflow-y-auto bg-white">
      <div className="relative mx-auto h-[812px] w-[375px] max-w-full overflow-hidden">
      <img
        key={step}
        src={slide.img}
        width="375"
        height="812"
        alt=""
        className="absolute left-0 top-0 block h-[812px] w-[375px]"
        style={{ animation: 'obPop .55s cubic-bezier(.22,1,.36,1) both' }}
      />

      {/* dots */}
      <div className="absolute left-0 right-0 top-16 z-[2] flex justify-center gap-[7px]">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStep(i + 1)}
            className="h-[7px] rounded-full transition-all"
            style={{ width: i === step - 1 ? 20 : 7, background: i === step - 1 ? '#121212' : '#e0e0e0' }}
          />
        ))}
      </div>

      {/* title + desc */}
      <div className="absolute left-0 right-0 top-[100px] z-[2] flex flex-col items-center gap-3 px-10">
        <span
          className="whitespace-pre-line text-center font-sans text-[23px] font-bold text-[#121212]"
          style={{ letterSpacing: '-.5px' }}
        >
          {slide.title}
        </span>
        <span
          className="h-11 whitespace-pre-line text-center font-sans text-[14px] font-light"
          style={{ color: '#9b9b9b', lineHeight: '22px', letterSpacing: '-.5px' }}
        >
          {slide.desc}
        </span>
      </div>

      {/* next */}
      <button
        type="button"
        onClick={next}
        className="absolute bottom-10 left-5 z-[2] flex h-[50px] w-[335px] items-center justify-center rounded-[20px] bg-ink"
      >
        <span className="font-sans text-[16px] font-medium text-white" style={{ letterSpacing: '-.3px' }}>
          {step >= 4 ? '완료' : '다음'}
        </span>
      </button>
      </div>
    </div>
  )
}
