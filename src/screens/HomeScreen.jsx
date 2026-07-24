import { useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDownSmall,
  ListenIcon,
  BookmarkIcon,
  PencilIcon,
} from '../components/icons.jsx'
import SegmentText from '../components/SegmentText.jsx'
import CalendarSheet from '../components/CalendarSheet.jsx'
import { speak } from '../lib/speak.js'
import {
  buildWeek,
  dateFromOff,
  HOME_ENTRIES,
  DAYS_WITH_ENTRY,
  DAY_LANG,
  PROMPTS,
} from '../data/diary.js'

const ACCENT = '#0066FF'

export default function HomeScreen({ userName = '현진', onWrite, onToast, onOpenEntry }) {
  const [selOff, setSelOff] = useState(0) // 0 = today (6/4)
  const [todayWritten] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [promptIdx, setPromptIdx] = useState(0)
  const [listen, setListen] = useState({})
  const [bookmark, setBookmark] = useState({})
  const scrollRef = useRef(null)

  const prompts = PROMPTS(userName)

  // rotate the writing prompt on the "오늘" empty card
  useEffect(() => {
    const t = setInterval(() => setPromptIdx((i) => (i + 1) % prompts.length), 3600)
    return () => clearInterval(t)
  }, [prompts.length])

  const date = dateFromOff(selOff)
  const week = buildWeek(selOff)
  const key = date.key

  const written = selOff === 0 ? todayWritten : selOff < 0 && DAYS_WITH_ENTRY.has(key)
  const isFuture = selOff > 0
  const todayEmpty = selOff === 0 && !todayWritten
  const emptyPast = selOff < 0 && !written
  const entries = written ? HOME_ENTRIES[key] || [] : []
  const lang = DAY_LANG[key] || 'KR'

  const selectDay = (d) => {
    if (d.isFuture) {
      onToast?.('아직 오지 않은 미래는 작성할 수 없어요.')
      return
    }
    setSelOff(d.off)
  }

  const toggleListen = (i, text) => {
    setListen((s) => ({ ...s, [i]: !s[i] }))
    if (!listen[i]) speak(text)
  }
  const toggleBookmark = (i) => {
    const was = bookmark[i]
    setBookmark((s) => ({ ...s, [i]: !s[i] }))
    onToast?.(was ? '저장을 취소했어요' : '표현을 저장했어요')
  }

  return (
    <>
      {/* ===== HEADER : date row + week strip ===== */}
      <div className="absolute left-0 top-[54px] z-20 w-full bg-white">
        {/* date row */}
        <div className="flex h-9 items-center justify-between px-4 py-0.5">
          <button
            type="button"
            className="flex items-center gap-1.5 px-1"
            onClick={() => setCalendarOpen(true)}
          >
            <span
              className="font-inter text-[20px] font-semibold text-ink"
              style={{ letterSpacing: '-.5px' }}
            >
              {date.title}
            </span>
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#f4f4f4]">
              <ChevronDownSmall />
            </span>
          </button>

          <div className="flex items-center gap-[5px]">
            <button
              type="button"
              onClick={() => setSelOff((o) => o - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full"
            >
              <ChevronLeft />
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
              onClick={() => setSelOff((o) => o + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full"
            >
              <ChevronRight color={isFuture ? '#d4d4d4' : '#121212'} />
            </button>
          </div>
        </div>

        {/* week strip */}
        <div className="flex h-[108px] justify-between gap-0 border-b border-[#eee] p-4">
          {week.map((d) => {
            const selected = d.off === selOff
            let numColor = '#121212'
            if (selected) numColor = '#fff'
            else if (d.isFuture) numColor = '#c4c4c4'
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
      <div
        ref={scrollRef}
        className="no-scrollbar absolute left-0 top-[198px] h-[526px] w-full overflow-y-auto bg-white"
      >
        <div className="px-5 pb-6 pt-7">
          {/* section header */}
          <div className="mb-5 flex h-[22px] items-center justify-between">
            <span
              className="font-inter text-[14px] font-semibold text-ink"
              style={{ letterSpacing: '.2px' }}
            >
              나의 일기
            </span>
            {written && (
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

          {/* today empty → prompt card */}
          {todayEmpty && (
            <button
              type="button"
              onClick={onWrite}
              className="flex min-h-[71px] w-full flex-col items-center justify-center gap-0.5 rounded-[20px] px-[18px] py-4"
              style={{ outline: '.5px dashed #abcfff', outlineOffset: '-.5px' }}
            >
              <span
                className="font-inter text-[12px]"
                style={{ color: ACCENT, letterSpacing: '-.2px' }}
              >
                6월 4일
              </span>
              <div className="flex h-6 items-center justify-center overflow-hidden">
                <span
                  key={promptIdx}
                  className="font-inter text-[15px] font-medium"
                  style={{
                    color: ACCENT,
                    lineHeight: '24px',
                    letterSpacing: '-.2px',
                    animation: 'promptFade 3.6s ease-in-out',
                  }}
                >
                  {prompts[promptIdx]}
                </span>
              </div>
            </button>
          )}

          {/* future day */}
          {isFuture && (
            <div
              className="flex min-h-[71px] flex-col items-center justify-center rounded-[20px] bg-[#fafafa] px-[18px] py-5 opacity-60"
              style={{ outline: '.5px dashed #e2e2e2', outlineOffset: '-.5px' }}
            >
              <span className="font-inter text-[14px] font-medium text-muted-2">
                아직 오지 않은 날이에요
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

          {/* entries */}
          <div className="flex flex-col gap-3">
            {entries.map((e, i) => (
              <div
                key={i}
                onClick={() => onOpenEntry?.(e.ko)}
                className="flex cursor-pointer items-start gap-3 rounded-[20px] bg-[#f7f7f7] p-4"
                style={{ boxShadow: 'inset 0 0 0 .5px #eee' }}
              >
                <div className="flex flex-1 flex-col items-end gap-3">
                  <div className="flex w-full flex-col gap-1">
                    {e.ko && (
                      <span className="mb-1.5 font-inter text-[14px] font-light leading-5 text-sub">
                        {e.ko}
                      </span>
                    )}
                    <SegmentText
                      segments={e.enSegs}
                      className="font-inter text-[16px] font-medium leading-6 text-ink-2"
                      style={{ letterSpacing: '-.2px' }}
                    />

                    {e.hasCorrection && (
                      <div className="mt-0.5 flex flex-col">
                        <div className="my-3 mb-3 mt-4 h-px bg-[#e6e6e6]" />
                        <span
                          className="font-inter text-[13px] font-medium"
                          style={{ color: ACCENT, letterSpacing: '-.1px' }}
                        >
                          교정
                        </span>
                        <SegmentText
                          segments={e.fixSegs}
                          className="mt-2 font-inter text-[16px] font-medium leading-6 text-ink-2"
                          style={{ letterSpacing: '-.2px' }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation()
                        toggleListen(
                          i,
                          e.hasCorrection
                            ? e.fixSegs.map((g) => g.t).join('')
                            : e.enSegs.map((g) => g.t).join(''),
                        )
                      }}
                      className="flex h-8 w-8"
                    >
                      <ListenIcon on={!!listen[i]} />
                    </button>
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation()
                        toggleBookmark(i)
                      }}
                      className="flex h-8 w-8"
                    >
                      <BookmarkIcon on={!!bookmark[i]} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== FAB ===== */}
      <button
        type="button"
        onClick={onWrite}
        className="absolute left-[299px] top-[643px] z-[25] flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: ACCENT, boxShadow: '0 8px 24px rgba(42,56,89,.25)' }}
      >
        <PencilIcon size={26} />
      </button>

      {/* ===== CALENDAR ===== */}
      {calendarOpen && (
        <CalendarSheet
          selOff={selOff}
          onSelect={(off) => {
            setSelOff(off)
            setCalendarOpen(false)
          }}
          onClose={() => setCalendarOpen(false)}
          onToast={onToast}
        />
      )}
    </>
  )
}
