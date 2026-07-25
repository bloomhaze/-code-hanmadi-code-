import { useState } from 'react'

// 알림 설정 — 일기 작성 리마인드 toggle + 시간 선택.
export default function NotifScreen({ onClose }) {
  const [on, setOn] = useState(true)
  const [time, setTime] = useState('18:30')

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white">
      {/* top bar */}
      <div className="relative flex h-12 shrink-0 items-center px-3">
        <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="#121212" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="font-sans text-[17px] font-semibold text-ink" style={{ letterSpacing: '-.3px' }}>
          알림 설정
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4">
      <div className="flex w-full flex-col overflow-hidden rounded-2xl bg-[#f7f7f8]">
        <div className="flex h-14 items-center px-[18px]">
          <span className="flex-1 font-sans text-[15px] text-ink" style={{ letterSpacing: '-.3px' }}>
            일기 작성 리마인드
          </span>
          <button
            type="button"
            onClick={() => setOn((v) => !v)}
            className="relative h-5 w-10 rounded-xl transition-colors"
            style={{ background: on ? '#0066ff' : '#d9d9d9' }}
          >
            <span
              className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
              style={{ left: on ? 22 : 2, boxShadow: '0 1px 3px rgba(0,0,0,.2)' }}
            />
          </button>
        </div>

        {on && (
          <div className="flex h-[60px] items-center border-t border-[#eee] px-[18px]">
            <span className="flex-1 font-sans text-[15px] text-ink" style={{ letterSpacing: '-.3px' }}>
              시간
            </span>
            <div className="relative flex h-[30px] min-w-[60px] items-center justify-center rounded-[10px] bg-white px-2.5">
              <span className="font-inter text-[16px] text-ink" style={{ letterSpacing: '-.3px' }}>
                {time}
              </span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value || time)}
                className="absolute inset-0 h-full w-full cursor-pointer border-none opacity-0"
              />
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
