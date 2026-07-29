import { useState } from 'react'

const MAX = 1000

// 개발자에게 한마디 — 자유 의견 입력 후 전달.
export default function DevFeedbackScreen({ onBack, onSubmit }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const trimmed = text.trim()
  const canSend = !!trimmed && !sending

  const send = async () => {
    if (!canSend) return
    setSending(true)
    try {
      await onSubmit?.(trimmed)
      onBack?.()
    } finally {
      setSending(false)
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

      {/* body */}
      <div className="flex min-h-0 flex-1 flex-col px-5 pt-3">
        <h1
          className="font-sans text-[23px] font-bold text-ink"
          style={{ letterSpacing: '-.5px', lineHeight: '1.35' }}
        >
          작은 의견 하나도
          <br />
          소중하게 반영할게요
        </h1>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          maxLength={MAX}
          placeholder="아이디어, 오류, 의견, 칭찬 모두 환영해요."
          className="no-scrollbar mt-5 min-h-0 flex-1 resize-none border-none bg-transparent font-sans text-[15px] leading-[1.6] text-ink outline-none placeholder:text-[#b7b7b7]"
          style={{ letterSpacing: '-.3px' }}
        />

        {/* char counter */}
        <div className="flex justify-end pb-2 pt-1">
          <span className="font-inter text-[13px]" style={{ color: '#b0b0b0', letterSpacing: '-.2px' }}>
            {text.length}/{MAX}
          </span>
        </div>

        {/* send button */}
        <div className="pb-5">
          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            className="h-[54px] w-full rounded-[27px] font-sans text-[16px] font-semibold transition-colors"
            style={{
              background: canSend ? '#121212' : '#ececec',
              color: canSend ? '#ffffff' : '#b0b0b0',
            }}
          >
            전달하기
          </button>
        </div>
      </div>
    </div>
  )
}
