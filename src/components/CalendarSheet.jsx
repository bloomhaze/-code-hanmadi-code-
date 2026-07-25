import { calendarMonths } from '../data/diary.js'

const ACCENT = '#0066FF'
const DOW = ['일', '월', '화', '수', '목', '금', '토']

// 홈 날짜 옆 ⌄ 를 누르면 열리는 월별 달력. 날짜를 고르면 그 날로 이동.
export default function CalendarSheet({ selOff, onSelect, onClose, onToast }) {
  const months = calendarMonths()

  const pick = (c) => {
    if (!c) return
    if (c.isFuture) {
      onToast?.('아직 오지 않은 미래는 작성할 수 없어요.')
      return
    }
    onSelect(c.off)
  }

  return (
    <>
      {/* dim backdrop */}
      <div className="fixed inset-0 z-[45] bg-black/35" onClick={onClose} />

      {/* close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-[47] flex h-8 w-8 items-center justify-center rounded-full"
        style={{ background: 'rgba(60,60,67,.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M1.5 1.5 12.5 12.5M12.5 1.5 1.5 12.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </button>

      {/* sheet */}
      <div className="absolute inset-x-0 bottom-0 top-3 z-[46] flex w-full flex-col overflow-hidden rounded-t-[24px] bg-white">
        {/* weekday header */}
        <div className="flex h-[54px] flex-shrink-0 border-b border-[#eee] px-3 pb-3.5 pt-[22px]">
          {DOW.map((d) => (
            <div key={d} className="flex-1 text-center font-inter text-[14px] text-ink">
              {d}
            </div>
          ))}
        </div>

        {/* months */}
        <div className="no-scrollbar flex-1 overflow-y-auto px-3 pb-10">
          {months.map((m) => (
            <div key={m.title}>
              <div className="py-6 text-center">
                <span
                  className="font-inter text-[20px] font-semibold text-ink"
                  style={{ letterSpacing: '-.5px' }}
                >
                  {m.title}
                </span>
              </div>
              {m.weeks.map((week, wi) => (
                <div key={wi} className="flex">
                  {week.map((c, ci) => {
                    if (!c) return <div key={ci} className="h-16 flex-1" />
                    const selected = c.off === selOff
                    let numColor = '#121212'
                    if (selected) numColor = '#fff'
                    else if (c.isFuture) numColor = '#c4c4c4'
                    else if (c.isToday) numColor = ACCENT
                    return (
                      <button
                        key={ci}
                        type="button"
                        onClick={() => pick(c)}
                        className="flex h-16 flex-1 flex-col items-center gap-[5px] py-2"
                      >
                        <span
                          className="flex h-[38px] w-[38px] items-center justify-center rounded-full"
                          style={{ background: selected ? '#121212' : 'transparent' }}
                        >
                          <span className="font-inter text-[17px]" style={{ color: numColor }}>
                            {c.day}
                          </span>
                        </span>
                        <span
                          className="h-[5px] w-[5px] rounded-full"
                          style={{ background: c.hasEntry ? ACCENT : 'transparent' }}
                        />
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
