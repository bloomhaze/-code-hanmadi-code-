import { useEffect, useState } from 'react'
import { HomeIcon, DiaryIcon, VocabIcon, MyIcon } from './icons.jsx'
import { haptic } from '../lib/haptic.js'

const TABS = [
  { key: 'home', label: '홈', Icon: HomeIcon },
  { key: 'diary', label: '일기', Icon: DiaryIcon },
  { key: 'vocab', label: '단어장', Icon: VocabIcon },
  { key: 'my', label: '마이', Icon: MyIcon },
]

// Shared bottom tab bar. Frosted-glass bar pinned to the bottom of the phone frame.
// hidden=true 이고 모바일(<640px)일 때만 아래로 슬라이드되어 숨는다(공간도 회수).
export default function TabBar({ active, onChange, hidden = false }) {
  const [popped, setPopped] = useState(null)
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])

  const hide = hidden && mobile

  return (
    <div
      className="z-20 w-full shrink-0 transition-all duration-300"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        transform: hide ? 'translateY(100%)' : 'translateY(0)',
        marginBottom: hide ? 'calc(-56px - env(safe-area-inset-bottom))' : '0px',
      }}
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
                haptic()
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
