// 실제 날짜 기반 달력 로직 (홈 탭 주간 스트립 + 달력 시트).
//  - 오늘은 실제 오늘(new Date())
//  - entrySet: 일기 있는 날짜 키(YYYY-M-D) 집합 → 파란 닷
//  - signupStart: 가입일(Date, 자정) → 그 이전은 비활성(노출 X)
const DOW = ['일', '월', '화', '수', '목', '금', '토']

export const ymd = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

export function realToday() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// 자정 기준 Date로 정규화 (ISO 문자열/Date 모두 허용)
export function midnight(v) {
  if (!v) return null
  const d = new Date(v)
  if (isNaN(d)) return null
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function cellOf(dt, base, entrySet, signup) {
  const off = Math.round((dt - base) / 86400000)
  return {
    off,
    key: ymd(dt),
    isToday: off === 0,
    isFuture: off > 0,
    beforeSignup: signup ? dt < signup : false,
    hasEntry: entrySet.has(ymd(dt)),
  }
}

// 선택 오프셋이 포함된 일~토 주간
export function buildWeek(selOff, entrySet, signup) {
  const base = realToday()
  const sel = new Date(base)
  sel.setDate(base.getDate() + selOff)
  const weekStart = new Date(sel)
  weekStart.setDate(sel.getDate() - sel.getDay())
  return Array.from({ length: 7 }).map((_, i) => {
    const dt = new Date(weekStart)
    dt.setDate(weekStart.getDate() + i)
    return { dow: DOW[dt.getDay()], num: dt.getDate(), ...cellOf(dt, base, entrySet, signup) }
  })
}

export function dateInfo(selOff) {
  const base = realToday()
  const dt = new Date(base)
  dt.setDate(base.getDate() + selOff)
  return {
    year: dt.getFullYear(),
    month: dt.getMonth() + 1,
    day: dt.getDate(),
    key: ymd(dt),
    title: `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일`,
    label: `${dt.getMonth() + 1}월 ${dt.getDate()}일`,
  }
}

function buildMonth(year, month, entrySet, signup) {
  const base = realToday()
  const startDow = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month - 1, d)
    cells.push({ day: d, ...cellOf(dt, base, entrySet, signup) })
  }
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return { title: `${year}년 ${month}월`, weeks }
}

// 가입월 ~ 다음 달까지의 월 목록 (미래는 이번 달 + 다음 달까지 노출, 회색 비활성)
export function monthsRange(signup, entrySet) {
  const today = realToday()
  const startY = signup ? signup.getFullYear() : today.getFullYear()
  const startM = signup ? signup.getMonth() : today.getMonth()
  // 종료 월 = 이번 달 + 1 (다음 달까지)
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const endY = end.getFullYear()
  const endM = end.getMonth()
  const months = []
  let y = startY
  let m = startM // 0-based
  for (let guard = 0; guard < 72; guard++) {
    months.push(buildMonth(y, m + 1, entrySet, signup))
    if (y === endY && m === endM) break
    m += 1
    if (m > 11) { m = 0; y += 1 }
  }
  return months
}
