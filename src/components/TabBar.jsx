import { useState } from 'react'
import { HomeIcon, DiaryIcon, VocabIcon, MyIcon } from './icons.jsx'

const TABS = [
  { key: 'home', label: '홈', Icon: HomeIcon },
  { key: 'diary', label: '일기', Icon: DiaryIcon },
  { key: 'vocab', label: '단어장', Icon: VocabIcon },
  { key: 'my', label: '마이', Icon: MyIcon },
]

// Shared bottom tab bar. Frosted-glass bar pinned to the bottom of the phone frame.
export default function TabBar({ active, onChange }) {
  const [popped, setPopped] = useState(null)

  return (
    <div
      className="z-20 w-full shrink-0"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* 56px tab row (표준 하단탭 높이) — 컬럼 전체 폭에 균등 배치 */}
      <div className="flex h-14 w-full items-center justify-around px-4">
        {TABS.map(({ key, label, Icon }) => {
          const isActive = active === key
          const color = isActive ? '#121212' : '#c4c4c4'
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setPopped(key)
                onChange(key)
              }}
              onAnimationEnd={() => setPopped(null)}
              className="tab-item flex flex-1 flex-col items-center gap-[3px] outline-none"
            >
              <span className={popped === key ? 'tab-pop' : ''}>
                <Icon fill={color} />
              </span>
              <span
                className="font-inter text-[11px]"
                style={{ color, fontWeight: isActive ? 500 : 400 }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
