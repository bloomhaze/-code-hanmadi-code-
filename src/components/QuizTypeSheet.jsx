import { useState } from 'react'

const TYPES = [
  { key: 'flash', label: '플래시 카드' },
  { key: 'blank', label: '빈칸 채우기' },
  { key: 'write', label: '작문 연습' },
]

// 학습 방식 선택 시트 → 퀴즈 시작.
export default function QuizTypeSheet({ onStart, onClose }) {
  const [type, setType] = useState('flash')

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center bg-black/35" onClick={onClose}>
      <div
        className="box-border flex w-full max-w-[500px] flex-col rounded-t-3xl bg-white px-5 pb-8 pt-2.5"
        style={{ animation: 'rollUp .28s cubic-bezier(.22,1,.36,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-[18px] h-1 w-9 rounded-full bg-[#dcdcdc]" />
        <span className="font-sans text-[20px] font-semibold text-ink">학습 방식</span>
        <span className="mb-5 mt-1 font-sans text-[14px] font-light text-muted">
          원하시는 학습 방식으로 자유롭게 공부하세요
        </span>

        <div className="flex flex-col gap-2.5">
          {TYPES.map((t) => {
            const active = type === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setType(t.key)}
                className="flex h-[55px] items-center gap-3.5 rounded-[20px] px-5"
                style={{
                  background: active ? '#eef4ff' : '#f7f7f8',
                  boxShadow: active ? 'inset 0 0 0 1.5px #0066ff' : 'none',
                }}
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full"
                  style={{
                    background: active ? '#0066ff' : '#fff',
                    boxShadow: active ? 'none' : 'inset 0 0 0 1.5px #dcdcdc',
                  }}
                >
                  {active && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
                </span>
                <span className="font-sans text-[16px] font-medium text-ink">{t.label}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => onStart(type)}
          className="mt-6 flex h-[54px] items-center justify-center rounded-[20px] bg-ink"
        >
          <span className="font-sans text-[16px] font-medium text-white">퀴즈 시작</span>
        </button>
      </div>
    </div>
  )
}
