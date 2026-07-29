import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDownSmall, PencilIcon, ListenIcon, BookmarkIcon } from '../components/icons.jsx'
import CalendarSheet from '../components/CalendarSheet.jsx'
import { buildWeek, dateInfo, monthsRange, midnight, realToday } from '../lib/homecal.js'
import { speak, stopSpeak } from '../lib/speak.js'
import { PROMPTS } from '../data/diary.js'

const ACCENT = '#0066FF'

// 문장의 영어 표시 텍스트 (교정본 우선, 없으면 원문/번역)
function enText(s) {
  if (!s) return ''
  if (s.correction) {
    if (Array.isArray(s.fixSegs)) return s.fixSegs.map((g) => g.t).join('')
    return s.corrected || s.en || ''
  }
  return s.en || ''
}

// 홈 탭 — 실제 날짜 달력(가입일 이후 노출, 일기 쓴 날 파란 닷) + 선택일의 내 일기.
export default function HomeScreen({ userName = '현진', diaries = [], signupDate, onWrite, onToast, onOpen, onSaveExpr, isSaved }) {
  const [selOff, setSelOff] = useState(0) // 0 = 오늘
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [promptIdx, setPromptIdx] = useState(0)
  const [playId, setPlayId] = useState(null) // 재생 중인 문장 키 `${entryId}-${i}`
  const [loadId, setLoadId] = useState(null) // 음성 로딩 중인 문장 키
  const scrollRef = useRef(null)

  // 화면 벗어나면 재생 중지
  useEffect(() => () => stopSpeak(), [])

  // 문장 듣기 — 한 번에 하나, 로딩→재생, 다시 누르면 정지, 끝나면 자동 off
  const toggleListen = (pid, text) => {
    if (playId === pid || loadId === pid) {
      stopSpeak()
      setPlayId(null)
      setLoadId(null)
      return
    }
    setLoadId(pid)
    setPlayId(null)
    speak(
      text,
      () => setPlayId((c) => (c === pid ? null : c)),
      () => {
        setLoadId((c) => (c === pid ? null : c))
        setPlayId(pid)
      },
    )
  }

  const prompts = PROMPTS(userName)
  useEffect(() => {
    const t = setInterval(() => setPromptIdx((i) => (i + 1) % prompts.length), 3600)
    return () => clearInterval(t)
  }, [prompts.length])

  const signup = useMemo(() => midnight(signupDate), [signupDate])
  const entrySet = useMemo(() => new Set(diaries.map((e) => e.dateKey)), [diaries])
  const months = useMemo(() => monthsRange(signup, entrySet), [signup, entrySet])

  const date = dateInfo(selOff)
  const week = buildWeek(selOff, entrySet, signup)

  const selDate = useMemo(() => {
    const d = realToday()
    d.setDate(d.getDate() + selOff)
    return d
  }, [selOff])
  const isToday = selOff === 0
  const isFuture = selOff > 0
  const beforeSignup = signup ? selDate < signup : false
  const blocked = isFuture || beforeSignup
  // 이전(<) 화살표: 하루 전이 가입일보다 앞서면 더 이동 불가 (가입 전은 아예 노출 X)
  const prevBlocked = useMemo(() => {
    if (!signup) return false
    const p = new Date(selDate)
    p.setDate(p.getDate() - 1)
    return p < signup
  }, [selDate, signup])
  // 다음(>) 화살표: 다음 날이 미래(오늘 이후)면 이동 불가
  const nextBlocked = useMemo(() => {
    const n = new Date(selDate)
    n.setDate(n.getDate() + 1)
    return n > realToday()
  }, [selDate])

  const entries = useMemo(() => diaries.filter((e) => e.dateKey === date.key), [diaries, date.key])
  const hasEntries = entries.length > 0
  const lang = hasEntries ? entries[0].lang : 'KR'
  const todayEmpty = isToday && !hasEntries
  const emptyPast = !blocked && !isToday && !hasEntries

  const selectDay = (d) => {
    if (d.isFuture) return onToast?.('아직 오지 않은 미래는 작성할 수 없어요.')
    if (d.beforeSignup) return onToast?.('가입 전 날짜예요.')
    setSelOff(d.off)
  }

  return (
    <div className="relative flex h-full flex-col bg-white">
      {/* 스크롤 컨테이너 — 모바일에선 헤더도 함께 스크롤, 데스크탑(≥sm)에선 헤더 고정(sticky) */}
      <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto bg-white">
      {/* ===== HEADER : date row + week strip ===== */}
      <div className="bg-white pt-4 sm:sticky sm:top-0 sm:z-10">
        <div className="flex h-9 items-center justify-between px-4 py-0.5">
          <button type="button" className="flex items-center gap-1.5 px-1" onClick={() => setCalendarOpen(true)}>
            <span className="font-inter text-[20px] font-semibold text-ink" style={{ letterSpacing: '-.5px' }}>
              {date.title}
            </span>
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#f4f4f4]">
              <ChevronDownSmall />
            </span>
          </button>

          <div className="flex items-center gap-[5px]">
            <button
              type="button"
              onClick={() => !prevBlocked && setSelOff((o) => o - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full"
            >
              <ChevronLeft color={prevBlocked ? '#d4d4d4' : '#121212'} />
            </button>
            <button
              type="button"
              onClick={() => setSelOff(0)}
              className="flex h-7 items-center rounded-xl bg-[#f4f4f4] px-3 transition-colors hover:bg-[#e4e4e4]"
            >
              <span className="font-inter text-[12px] text-ink" style={{ letterSpacing: '-.2px' }}>
                오늘
              </span>
            </button>
            <button
              type="button"
              onClick={() => !nextBlocked && setSelOff((o) => o + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full"
            >
              <ChevronRight color={nextBlocked ? '#d4d4d4' : '#121212'} />
            </button>
          </div>
        </div>

        {/* week strip */}
        <div className="flex h-[108px] justify-between gap-0 border-b border-[#eee] p-4">
          {week.map((d) => {
            // 가입 전 날짜는 아예 노출하지 않음 — 빈칸만 유지
            if (d.beforeSignup) return <div key={d.key} className="w-[41px]" />
            const selected = d.off === selOff
            const disabled = d.isFuture
            let numColor = '#121212'
            if (selected) numColor = '#fff'
            else if (disabled) numColor = '#c4c4c4'
            else if (d.isToday) numColor = ACCENT
            return (
              <button
                type="button"
                key={d.key}
                onClick={() => selectDay(d)}
                className="flex w-[41px] flex-col items-center gap-2"
              >
                <span className="font-inter text-[13px] text-ink">{d.dow}</span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: selected ? '#121212' : 'transparent' }}
                >
                  <span className="font-inter text-[16px]" style={{ color: numColor }}>
                    {d.num}
                  </span>
                </span>
                <span
                  className="h-[5px] w-[5px] rounded-full"
                  style={{ background: d.hasEntry ? ACCENT : 'transparent' }}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* ===== CONTENT ===== */}
        <div className="px-5 pb-6 pt-7">
          <div className="mb-5 flex h-[22px] items-center justify-between">
            <span className="font-inter text-[14px] font-semibold text-ink" style={{ letterSpacing: '.2px' }}>
              나의 일기
            </span>
            {hasEntries && (
              <span
                className="flex h-[22px] w-[31px] items-center justify-center rounded-full"
                style={{ background: lang === 'EN' ? '#dcebff' : '#f1f1f2' }}
              >
                <span
                  className="font-inter text-[11px] font-medium"
                  style={{ color: lang === 'EN' ? '#0066ff' : '#7a7b7d' }}
                >
                  {lang}
                </span>
              </span>
            )}
          </div>

          {/* today empty → prompt card (연필 아이콘 + 롤링 질문) */}
          {todayEmpty && (
            <button
              type="button"
              onClick={onWrite}
              className="flex min-h-[71px] w-full items-center justify-center gap-2 rounded-[20px] px-[18px] py-4"
              style={{ outline: '.5px dashed #abcfff', outlineOffset: '-.5px' }}
            >
              <div className="flex h-6 items-center justify-center overflow-hidden">
                <span
                  key={promptIdx}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                  style={{ animation: 'promptFade 3.6s ease-in-out' }}
                >
                  <PencilIcon size={15} fill={ACCENT} />
                  <span
                    className="font-inter text-[15px] font-medium"
                    style={{ color: ACCENT, lineHeight: '24px', letterSpacing: '-.2px' }}
                  >
                    {prompts[promptIdx]}
                  </span>
                </span>
              </div>
            </button>
          )}

          {/* future / before-signup */}
          {blocked && (
            <div
              className="flex min-h-[71px] flex-col items-center justify-center rounded-[20px] bg-[#fafafa] px-[18px] py-5 opacity-60"
              style={{ outline: '.5px dashed #e2e2e2', outlineOffset: '-.5px' }}
            >
              <span className="font-inter text-[14px] font-medium text-muted-2">
                {isFuture ? '아직 오지 않은 날이에요' : '가입 전 날짜예요'}
              </span>
            </div>
          )}

          {/* empty past day */}
          {emptyPast && (
            <div className="flex flex-col items-center gap-1.5 pb-10 pt-[120px]">
              <span className="font-inter text-[16px] font-medium text-ink">작성한 일기가 없어요</span>
              <span className="font-inter text-[13px] font-light text-muted-2">
                내 이야기로 영어 공부를 시작해보세요
              </span>
              <button
                type="button"
                onClick={onWrite}
                className="mt-3.5 flex items-center gap-1.5 rounded-full py-2.5 pl-4 pr-5"
                style={{ background: ACCENT }}
              >
                <PencilIcon size={16} />
                <span className="font-inter text-[14px] font-medium text-white">일기 쓰기</span>
              </button>
            </div>
          )}

          {/* entries for the selected day — 문장 단위(한/영) 글 형태. 단어 탭 없음, 전체 클릭 시 상세로 이동 */}
          <div className="flex flex-col gap-5">
            {hasEntries &&
              entries.map((e) => (
                <div key={e.id} className="flex flex-col gap-[9px]">
                  {(e.sentences || []).map((s, i) => {
                    const en = enText(s)
                    const pid = `${e.id}-${i}`
                    const bm = isSaved?.('sentence', en) || false
                    return (
                      <div
                        key={i}
                        onClick={() => onOpen?.(e.id)}
                        className="flex cursor-pointer flex-col gap-1.5 rounded-[20px] bg-[#f7f7f7] p-5"
                        style={{ boxShadow: 'inset 0 0 0 .5px #eee' }}
                      >
                        <span className="mb-1.5 font-sans text-[14px] font-light leading-5 text-sub">{s.ko}</span>
                        <span
                          className="font-inter text-[16px] text-ink"
                          style={{ lineHeight: '26px', letterSpacing: '-.2px' }}
                        >
                          {en}
                        </span>
                        <div className="mt-1 flex justify-end gap-2" onClick={(ev) => ev.stopPropagation()}>
                          <button type="button" onClick={() => toggleListen(pid, en)} className="h-8 w-8">
                            <ListenIcon on={playId === pid} loading={loadId === pid} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSaveExpr?.({ type: 'sentence', term: en, data: { ko: s.ko || '' } })}
                            className="h-8 w-8"
                          >
                            <BookmarkIcon on={bm} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* ===== FAB — 오늘이고 아직 일기를 안 쓴 경우에만 노출(하루 1개) ===== */}
      {todayEmpty && (
        <button
          type="button"
          onClick={onWrite}
          className="absolute bottom-5 right-5 z-[25] flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: ACCENT, boxShadow: '0 8px 24px rgba(42,56,89,.25)' }}
        >
          <PencilIcon size={26} />
        </button>
      )}

      {/* ===== CALENDAR ===== */}
      {calendarOpen && (
        <CalendarSheet
          months={months}
          selOff={selOff}
          onSelect={(off) => {
            setSelOff(off)
            setCalendarOpen(false)
          }}
          onClose={() => setCalendarOpen(false)}
          onToast={onToast}
        />
      )}
    </div>
  )
}
