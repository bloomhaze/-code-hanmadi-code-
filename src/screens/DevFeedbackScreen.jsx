const EMAIL = 'svs9645@gmail.com'

// 개발자에게 한마디 — 안내 문구 + 이메일 복사.
export default function DevFeedbackScreen({ onBack, onToast }) {
  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(EMAIL)
      } else {
        const ta = document.createElement('textarea')
        ta.value = EMAIL
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      onToast?.('이메일을 복사했어요', undefined, true)
    } catch {
      onToast?.('복사에 실패했어요. 길게 눌러 복사해주세요.')
    }
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white">
      {/* top bar */}
      <div className="flex h-12 shrink-0 items-center px-3 pt-4">
        <button type="button" onClick={onBack} className="flex h-11 w-11 items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="#121212" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* center content */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
        <h1 className="font-sans text-[18px] font-bold text-ink" style={{ letterSpacing: '-.4px' }}>
          작은 의견 하나도 소중해요
        </h1>
        <p
          className="mt-2.5 font-sans text-[14px] font-normal"
          style={{ color: '#b0b0b0', lineHeight: '1.55', letterSpacing: '-.2px' }}
        >
          아이디어, 오류, 의견, 칭찬 모두
          <br />
          아래 메일로 보내주시면 꼼꼼하게 읽을게요 :)
        </p>
        <button
          type="button"
          onClick={copy}
          className="mt-8 font-inter text-[21px] font-medium"
          style={{ color: '#0066ff', letterSpacing: '-.3px' }}
        >
          {EMAIL}
        </button>
      </div>

      {/* copy button */}
      <div className="px-5 pb-5">
        <button
          type="button"
          onClick={copy}
          className="h-[54px] w-full rounded-[27px] font-sans text-[16px] font-semibold text-white"
          style={{ background: '#121212' }}
        >
          이메일 복사
        </button>
      </div>
    </div>
  )
}
