const ACCENT = '#2083E7'
const DOW = ['일', '월', '화', '수', '목', '금', '토']

// 홈 날짜 옆 ⌄ 를 누르면 열리는 월별 달력. 날짜를 고르면 그 날로 이동.
// months: 실제 날짜 기반 월 목록(가입월~이번달). 각 셀에 isFuture/beforeSignup/hasEntry.
export default function CalendarSheet({ months = [], selOff, onSelect, onClose, onToast }) {
  const pick = (c) => {
    if (!c) return
    if (c.isFuture) {
      onToast?.('아직 오지 않은 미래는 작성할 수 없어요.')
      return
    }
    if (c.beforeSignup) {
      onToast?.('가입 전 날짜예요.')
      return
    }
    onSelect(c.off)
  }

  return (
    <div
      className="fixed inset-0 z-[46] flex items-end justify-center bg-black/35 sm:items-center sm:px-5"
      onClick={onClose}
    >
      {/* 모바일: 하단 바텀시트(sheetUp) / 데스크탑(≥sm): 중앙 카드(scaleIn).
          .ws-sheet 클래스가 화면폭에 따라 등장 애니메이션을 바꿔준다. */}
      <div
        className="ws-sheet flex h-[88dvh] w-full max-w-[500px] flex-col overflow-hidden rounded-t-[24px] bg-white sm:h-[calc(100dvh-16px)] sm:rounded-[24px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모바일 바텀시트 그랩 핸들 (데스크탑에서는 숨김) */}
        <div className="mx-auto mb-1 mt-3 h-[5px] w-10 shrink-0 rounded-full bg-[#e3e3e3] sm:hidden" />

        {/* header with close button (top-right) */}
        <div className="flex h-12 shrink-0 items-center justify-end px-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: 'rgba(60,60,67,.1)' }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M1.5 1.5 12.5 12.5M12.5 1.5 1.5 12.5" stroke="#555" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* weekday header */}
        <div className="flex h-[46px] flex-shrink-0 border-b border-[#eee] px-3 pb-3">
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
                    // 가입 전 / 미래(오늘 아님)는 비활성(회색)으로 보여줌
                    let numColor = '#121212'
                    if (selected) numColor = '#fff'
                    else if (c.isFuture || c.beforeSignup) numColor = '#c4c4c4'
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
    </div>
  )
}
