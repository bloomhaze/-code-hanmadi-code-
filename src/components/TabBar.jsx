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
      className="absolute bottom-0 left-0 z-20 h-[88px] w-full border-t"
      style={{
        background: 'rgba(247,247,247,.72)',
        backdropFilter: 'blur(16px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.3)',
        borderColor: 'rgba(0,0,0,.04)',
      }}
    >
      <div className="flex h-16 justify-center py-2.5">
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
              className="tab-item flex w-[93.75px] flex-col items-center gap-[3px] outline-none"
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
      {/* home-indicator space */}
      <div className="flex h-6 items-center justify-center" />
    </div>
  )
}
