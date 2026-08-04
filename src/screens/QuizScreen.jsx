import { useMemo, useRef, useState } from 'react'
import { buildQuizList, blankAnswerFor, writeHintFor, koOf } from '../data/quiz.js'
import { gradeWriting } from '../lib/grade.js'
import { SavedEmptyIllust } from '../components/icons.jsx'

// left is a % of the container so confetti spreads across the full width (max 500)
const CONFETTI = [
  ['8%', '70px', 12, 12, '50%', '#8ee06b', '2.6s', '0s'],
  ['32%', '20px', 14, 14, '0', '#ffd23f', '2.9s', '.2s'],
  ['53%', '50px', 10, 18, '0', '#f5a2e0', '3.1s', '.5s'],
  ['77%', '30px', 13, 13, '50%', '#3d8bff', '2.7s', '.1s'],
  ['91%', '90px', 14, 6, '0', '#8ecdff', '3.0s', '.35s'],
  ['16%', '140px', 15, 15, '0', '#ffd23f', '3.2s', '.6s'],
  ['67%', '130px', 11, 11, '50%', '#8ee06b', '2.8s', '.15s'],
  ['40%', '170px', 12, 20, '0', '#f5a2e0', '3.3s', '.45s'],
  ['5%', '220px', 13, 13, '50%', '#3d8bff', '3.0s', '.25s'],
  ['85%', '200px', 14, 14, '0', '#ffd23f', '2.9s', '.55s'],
  ['24%', '280px', 10, 16, '0', '#8ecdff', '3.1s', '.3s'],
  ['75%', '300px', 12, 12, '50%', '#f5a2e0', '3.4s', '.5s'],
]

export default function QuizScreen({ type = 'flash', saved = [], onClose, onToast, onComplete }) {
  const initial = useMemo(() => buildQuizList(type, saved, 1), [type, saved])
  const [list, setList] = useState(initial)
  const [qi, setQi] = useState(0)
  const [right, setRight] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [marks, setMarks] = useState({})
  const [done, setDone] = useState(false)

  // flashcard
  const [side, setSide] = useState('kr')
  const [revealed, setRevealed] = useState(false)
  // blank
  const [blank, setBlank] = useState('')
  const [blankChecked, setBlankChecked] = useState(false)
  // writing
  const [writeText, setWriteText] = useState('')
  const [hint, setHint] = useState(false)
  const [grading, setGrading] = useState(false)
  const [graded, setGraded] = useState(null)
  const gradeTimer = useRef(null)

  const total = list.length || 1
  const cur = list[qi] || null
  const mark = marks[qi]

  const resetPerQuestion = () => {
    setRevealed(false)
    setBlank('')
    setBlankChecked(false)
    setWriteText('')
    setHint(false)
    setGrading(false)
    setGraded(null)
  }

  const applyMark = (correct) => {
    const now = correct ? 'right' : 'wrong'
    setMarks((m) => {
      const prev = m[qi]
      if (prev !== now) {
        setRight((r) => r + (now === 'right' ? 1 : 0) - (prev === 'right' ? 1 : 0))
        setWrong((w) => w + (now === 'wrong' ? 1 : 0) - (prev === 'wrong' ? 1 : 0))
      }
      return { ...m, [qi]: now }
    })
  }

  const next = () => {
    if (qi >= list.length - 1) {
      // 세션 완료 기록 (복습 문항 수 = 이번 리스트 길이)
      onComplete?.({ total: list.length, correct: right })
      setDone(true)
      return
    }
    setQi(qi + 1)
    resetPerQuestion()
  }
  const prev = () => {
    if (qi <= 0) return
    setQi(qi - 1)
    resetPerQuestion()
  }

  const retryWrong = () => {
    const wrongList = list.filter((_, i) => marks[i] === 'wrong')
    if (!wrongList.length) return onClose()
    setList(wrongList)
    setQi(0)
    setRight(0)
    setWrong(0)
    setMarks({})
    setDone(false)
    resetPerQuestion()
  }
  const continueMore = () => {
    const more = buildQuizList(type, saved, list.length + 7)
    setList(list.concat(more))
    setQi(list.length)
    setDone(false)
    resetPerQuestion()
  }

  // ---- 저장한 표현이 없어 퀴즈를 만들 수 없을 때 ----
  if (!list.length) {
    const label = type === 'write' ? '문장' : type === 'blank' ? '표현·문장' : '단어·표현'
    return (
      <div className="absolute inset-0 z-40 flex flex-col bg-white">
        <div className="flex h-[60px] w-full shrink-0 items-center px-5 pt-4">
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="#121212" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-8 pb-24">
          <SavedEmptyIllust size={96} />
          <span className="mt-4 font-sans text-[17px] font-semibold text-ink" style={{ letterSpacing: '-.3px' }}>
            아직 복습할 {label}이 없어요
          </span>
          <span className="mt-2 text-center font-sans text-[14px] text-muted" style={{ lineHeight: '21px' }}>
            일기를 쓰고 마음에 드는 {label}을(를) 저장하면
            <br />
            그 표현으로 퀴즈가 만들어져요
          </span>
          <button
            type="button"
            onClick={onClose}
            className="mt-7 flex h-12 items-center justify-center rounded-[20px] bg-ink px-7"
          >
            <span className="font-sans text-[15px] font-medium text-white">확인</span>
          </button>
        </div>
      </div>
    )
  }

  // ---- DONE ----
  if (done) {
    const hasWrong = wrong > 0
    return (
      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center overflow-hidden bg-white px-8">
        <button type="button" onClick={onClose} className="absolute left-4 top-14 z-[3] flex h-10 w-10 items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="#121212" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {CONFETTI.map((c, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: c[0],
                top: c[1],
                width: c[2],
                height: c[3],
                borderRadius: c[4],
                background: c[5],
                animation: `confFall ${c[6]} ease-in ${c[7]} infinite`,
              }}
            />
          ))}
        </div>
        <div
          className="z-[2] flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: '#0066FF', animation: 'donePop .5s cubic-bezier(.34,1.56,.64,1) both' }}
        >
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <path d="M14 27l9 9 16-19" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="z-[2] mt-6 font-sans text-[24px] font-semibold text-ink" style={{ letterSpacing: '-.5px' }}>
          대단해요!
        </span>
        <span className="z-[2] mt-2.5 text-center font-sans text-[15px] font-medium text-muted" style={{ lineHeight: '22px' }}>
          오늘의 복습을 완료했어요
        </span>
        <span className="z-[2] mt-1.5 font-sans text-[14px]" style={{ color: '#c0c0c0' }}>
          맞은 개수 {right} · 틀린 개수 {wrong}
        </span>
        <button
          type="button"
          onClick={hasWrong ? retryWrong : continueMore}
          className="absolute inset-x-5 bottom-9 z-[2] flex h-[50px] items-center justify-center gap-1.5 rounded-[20px] bg-ink"
        >
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
            <path d="M15.5 5.5A6.5 6.5 0 1 0 16.9 12" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M16.5 3.2V6.2H13.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-sans text-[16px] font-medium text-white">
            {hasWrong ? `틀린 ${wrong}개, 다시 복습` : '이어서 더 복습하기'}
          </span>
        </button>
      </div>
    )
  }

  // ---- shared header ----
  const Header = () => (
    <div className="flex h-[60px] w-full shrink-0 items-center gap-3.5 px-5 pt-4">
      <button type="button" onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M18 6L6 18" stroke="#121212" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <div className="h-1.5 grow overflow-hidden rounded-full bg-[#eee]">
        <div
          className="h-1.5 rounded-full bg-accent transition-all"
          style={{ width: `${Math.round(((qi + 1) / total) * 100)}%` }}
        />
      </div>
      <span className="shrink-0 font-inter text-[15px] text-ink">
        {qi + 1} / {total}
      </span>
    </div>
  )

  return (
    <div className="no-scrollbar absolute inset-0 z-40 overflow-y-auto bg-white">
      {/* max-w-500 centered; grows vertically to fill the viewport */}
      <div className="mx-auto flex h-full min-h-[620px] w-full max-w-[500px] flex-col">
        <Header />
        {type === 'flash' && <Flashcard {...{ cur, side, setSide, revealed, setRevealed, mark, right, wrong, qi, applyMark, next, prev }} />}
        {type === 'blank' && (
          <BlankQuiz {...{ cur, blank, setBlank, blankChecked, setBlankChecked, applyMark, next, qi, total }} />
        )}
        {type === 'write' && (
          <WriteQuiz
            {...{ cur, writeText, setWriteText, hint, setHint, grading, setGrading, graded, setGraded, gradeTimer, applyMark, next, qi, total, onToast }}
          />
        )}
      </div>
    </div>
  )
}

/* ---------------- Flashcard ---------------- */
function Flashcard({ cur, side, setSide, revealed, setRevealed, mark, right, wrong, qi, applyMark, next, prev }) {
  const ko = koOf(cur)
  const en = cur?.term || ''
  const front = side === 'kr' ? ko : en
  const back = side === 'kr' ? en : ko
  const text = revealed ? back : front
  const isEn = revealed ? side !== 'kr' : side === 'kr'
  // text language: front is ko when side kr; revealed flips
  const showingEn = revealed ? side === 'kr' : side !== 'kr'

  const setSideAndReset = (s) => {
    setSide(s)
    setRevealed(false)
  }

  const wrongBg = mark === 'wrong' ? '#ff4242' : '#f4f4f5'
  const wrongInk = mark === 'wrong' ? '#fff' : '#ff4242'
  const rightBg = mark === 'right' ? '#00a836' : '#f4f4f5'
  const rightInk = mark === 'right' ? '#fff' : '#00a836'
  // Next is enabled only after the card is graded (X or ✓ picked).
  const marked = mark === 'right' || mark === 'wrong'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* side toggle */}
      <div className="flex h-[60px] w-full shrink-0 items-center justify-center px-5 pb-2.5 pt-3.5">
        <div className="box-border flex w-[132px] gap-0.5 rounded-full p-[3px]" style={{ background: 'rgba(112,115,124,.08)' }}>
          {[
            { k: 'kr', label: '한글 뜻' },
            { k: 'en', label: '영어' },
          ].map(({ k, label }) => {
            const on = side === k
            return (
              <button
                key={k}
                type="button"
                onClick={() => setSideAndReset(k)}
                className="box-border flex flex-1 items-center justify-center rounded-full px-4 py-[7px]"
                style={{ background: on ? '#fff' : 'transparent', boxShadow: on ? '0 1px 4px rgba(0,0,0,.1)' : 'none' }}
              >
                <span
                  className="whitespace-nowrap font-sans text-[13px]"
                  style={{ fontWeight: on ? 600 : 400, color: on ? '#121212' : '#8b8d94' }}
                >
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* card */}
      <div
        className="mx-5 box-border flex min-h-0 flex-1 flex-col rounded-3xl p-7"
        style={{
          background: revealed ? '#5f5f5f' : '#fff',
          border: revealed ? 'none' : '1px solid #eee',
          boxShadow: '0 4px 20px rgba(17,17,26,.05)',
          transition: 'background .25s ease',
        }}
      >
        <div className="flex grow flex-col items-center justify-center">
          <span
            className="text-center text-[28px] font-medium"
            style={{
              fontFamily: showingEn ? "'Inter Variable','Inter',sans-serif" : "'Pretendard Variable','Pretendard',sans-serif",
              lineHeight: '43.2px',
              letterSpacing: '-.5px',
              color: revealed ? '#fff' : '#121212',
            }}
          >
            {text}
          </span>
        </div>
        <div className="flex justify-center self-center">
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="flex h-[37px] items-center rounded-full bg-ink px-4"
          >
            <span className="font-sans text-[14px] font-semibold text-white">{revealed ? '뒤집기' : '정답 보기'}</span>
          </button>
        </div>
      </div>

      {/* bottom bar */}
      <div className="box-border flex h-[90px] w-full shrink-0 items-center gap-3 px-5 pb-5 pt-[18px]">
        <button
          type="button"
          onClick={prev}
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#f4f4f5]"
          style={{ opacity: qi > 0 ? 1 : 0.4 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="#121212" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => applyMark(false)}
          className="flex h-[52px] grow items-center justify-center gap-2 rounded-full"
          style={{ background: wrongBg }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M5 5l8 8M13 5l-8 8" stroke={wrongInk} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="font-inter text-[17px] font-bold" style={{ color: wrongInk }}>
            {wrong}
          </span>
        </button>
        <button
          type="button"
          onClick={() => applyMark(true)}
          className="flex h-[52px] grow items-center justify-center gap-2 rounded-full"
          style={{ background: rightBg }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 9.5l3.5 3.5L14 6" stroke={rightInk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-inter text-[17px] font-bold" style={{ color: rightInk }}>
            {right}
          </span>
        </button>
        <button
          type="button"
          onClick={() => marked && next()}
          disabled={!marked}
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full"
          style={{ background: marked ? '#121212' : '#f4f4f5', cursor: marked ? 'pointer' : 'default' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 5l7 7-7 7"
              stroke={marked ? '#fff' : '#c4c4c4'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

/* ---------------- Fill-in-blank ---------------- */
function BlankQuiz({ cur, blank, setBlank, blankChecked, setBlankChecked, applyMark, next, qi, total }) {
  const ko = koOf(cur)
  const term = (cur?.term || '').trim()
  const answer = blankAnswerFor(cur)
  const idx = term.indexOf(answer)
  const pre = idx > 0 ? term.slice(0, idx) : ''
  const post = idx >= 0 ? term.slice(idx + answer.length) : ''
  const correct = blank.trim().toLowerCase() === answer.toLowerCase()

  const check = () => {
    setBlankChecked(true)
    applyMark(correct)
  }
  const btnAction = () => {
    if (blankChecked) next()
    else if (blank.trim()) check()
  }
  const btnLabel = blankChecked ? (qi >= total - 1 ? '완료' : '다음') : '정답 확인'
  const ready = blankChecked || blank.trim()

  const pillInk = !blankChecked ? '#0066ff' : correct ? '#00a836' : '#ff4242'
  const pillBg = !blankChecked ? '#eaf1ff' : correct ? '#e3f6ea' : '#ffe1e1'
  const showCaret = !blankChecked && !blank.trim()
  const sizer = blank || ' ' // thin space keeps an empty pill minimal-width

  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 pb-[18px] pt-2">
      <div className="box-border flex min-h-0 flex-1 flex-col items-center rounded-3xl border border-[#eee] bg-white px-[26px] pb-6 pt-7" style={{ boxShadow: '0 4px 20px rgba(17,17,26,.05)' }}>
        <div className="flex grow flex-col items-start justify-center gap-4 self-stretch">
          <span className="text-left font-sans text-[16px] font-normal" style={{ color: 'rgba(46,47,51,.6)', letterSpacing: '-.2px' }}>
            {ko}
          </span>
          <div className="flex flex-wrap items-center font-inter text-[22px] font-bold text-ink" style={{ letterSpacing: '-.3px', lineHeight: 1.5 }}>
            <span className="font-medium" style={{ whiteSpace: 'pre-wrap' }}>
              {pre}
            </span>
            <span
              className="relative mx-0.5 inline-block min-h-[32px] rounded-[9px]"
              style={{ background: pillBg, cursor: 'text' }}
            >
              {/* hidden sizer — pill hugs the typed text (empty ⇒ minimal width) */}
              <span
                className="invisible px-2.5 py-1 font-inter text-[22px] font-bold"
                style={{ whiteSpace: 'pre', letterSpacing: '-.3px' }}
              >
                {sizer}
              </span>
              {/* visible text overlay */}
              <span
                className="absolute inset-0 flex items-center px-2.5 py-1 font-inter text-[22px] font-bold"
                style={{ whiteSpace: 'pre', letterSpacing: '-.3px', color: pillInk }}
              >
                {blank}
              </span>
              {showCaret && (
                <span
                  className="absolute left-2.5 w-0.5 rounded-[1px]"
                  style={{ top: '50%', height: 26, transform: 'translateY(-50%)', background: '#2f6bff', animation: 'blink 1.05s steps(1) infinite' }}
                />
              )}
              <input
                value={blank}
                onChange={(e) => setBlank(e.target.value)}
                disabled={blankChecked}
                autoFocus
                className="absolute inset-0 h-full w-full border-none bg-transparent px-2.5 py-1 text-left font-inter text-[22px] font-medium outline-none"
                style={{ letterSpacing: '-.3px', color: 'transparent', caretColor: '#2f6bff' }}
              />
            </span>
            <span className="font-medium" style={{ whiteSpace: 'pre-wrap' }}>
              {post}
            </span>
          </div>
        </div>

        {blankChecked ? (
          <div className="flex flex-col items-center gap-[11px]">
            {!correct && (
              <span className="font-sans text-[16px] font-normal" style={{ color: 'rgba(46,47,51,.61)' }}>
                정답: <span className="font-inter text-[16px] font-semibold text-ink">{answer}</span>
              </span>
            )}
            <div className="flex items-center gap-1.5">
              {correct ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="#00a836" strokeWidth="1.5" />
                    <path d="M5 8l2 2 4-4" stroke="#00a836" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="font-sans text-[18px] font-semibold" style={{ color: '#00a836' }}>
                    정답이에요!
                  </span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="#ff4242" strokeWidth="1.5" />
                    <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#ff4242" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="font-sans text-[18px] font-semibold" style={{ color: '#ff4242' }}>
                    아쉬워요
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
          <span className="font-sans text-[13px] font-normal" style={{ color: 'rgba(46,47,51,.28)' }}>
            정답 확인 버튼을 눌러주세요
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={btnAction}
        className="mt-3.5 flex h-12 w-full shrink-0 items-center justify-center rounded-[20px]"
        style={{ background: ready ? '#121212' : '#efefef' }}
      >
        <span className="font-sans text-[15px] font-medium" style={{ color: ready ? '#fff' : '#bdbdbd', letterSpacing: '-.2px' }}>
          {btnLabel}
        </span>
      </button>
    </div>
  )
}

/* ---------------- Writing ---------------- */
function WriteQuiz({ cur, writeText, setWriteText, hint, setHint, grading, setGrading, graded, setGraded, gradeTimer, applyMark, next, qi, total }) {
  const ko = koOf(cur)
  const expr = writeHintFor(cur)
  // When the answer is accepted, surface the DB-saved model as an alternative
  // ("이렇게도 쓸 수 있어요") — but only if it differs from what the user wrote.
  const showAlt = !!(graded && graded.ok && (graded.better || '').trim().toLowerCase() !== writeText.trim().toLowerCase())

  const doGrade = async () => {
    if (!writeText.trim() || grading) return
    setGrading(true)
    try {
      const res = await gradeWriting(cur, writeText)
      setGraded(res)
      applyMark(res.ok)
    } finally {
      setGrading(false)
    }
  }
  const btnAction = grading ? () => {} : graded ? next : doGrade
  const btnLabel = grading ? 'AI 첨삭 중' : graded ? (qi >= total - 1 ? '완료' : '다음') : '정답 확인'
  const ready = grading || graded || writeText.trim()

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 px-5 pb-[18px] pt-2">
      <div className="box-border flex shrink-0 flex-col gap-1.5 rounded-2xl bg-[#f5f5f6] px-5 py-[18px]">
        <span className="font-sans text-[14px] font-normal text-muted">이 문장을 영작해보세요</span>
        <span className="font-sans text-[16px] font-medium text-ink" style={{ lineHeight: '26px' }}>
          {ko}
        </span>
      </div>

      <div className="flex min-h-[34px] shrink-0 items-center gap-2.5">
        {!hint ? (
          <button type="button" onClick={() => setHint(true)} className="flex h-[34px] items-center rounded-xl bg-ink px-2.5">
            <span className="font-sans text-[12px] font-semibold text-white">힌트 보기</span>
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-[34px] items-center rounded-xl bg-ink px-2.5">
              <span className="font-sans text-[12px] font-semibold text-white">이 표현 쓰기</span>
            </div>
            <span className="font-inter text-[15px] font-bold text-ink" style={{ letterSpacing: '-.2px' }}>
              {expr}
            </span>
          </div>
        )}
      </div>

      {!graded ? (
        <div className="box-border min-h-0 flex-1 rounded-[20px] bg-white p-[18px]" style={{ boxShadow: 'inset 0 0 0 1px #ececee' }}>
          <textarea
            value={writeText}
            onChange={(e) => setWriteText(e.target.value)}
            disabled={grading}
            placeholder="여기에 영어로 작성해보세요."
            className="h-full w-full resize-none border-none bg-transparent font-inter text-[16px] text-ink outline-none placeholder:text-[#BFBFBF]"
            style={{ lineHeight: '24px' }}
          />
        </div>
      ) : (
        <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto">
          {/* learner's answer */}
          <div
            className="flex flex-col gap-2.5 rounded-[20px] bg-white px-[18px] py-4"
            style={{ boxShadow: `inset 0 0 0 1.5px ${graded.ok ? '#37b24d' : '#ff6b6b'}` }}
          >
            <div className="flex items-center gap-1.5">
              {graded.ok ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#00a836" strokeWidth="1.5" />
                  <path d="M5 8l2 2 4-4" stroke="#00a836" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#ff4242" strokeWidth="1.5" />
                  <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#ff4242" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
              <span className="font-sans text-[14px] font-medium" style={{ color: graded.ok ? '#00a836' : '#ff4242' }}>
                {graded.ok ? '잘했어요!' : '아쉬워요'}
              </span>
            </div>
            <span className="font-inter text-[16px] text-ink" style={{ lineHeight: '24px' }}>
              {writeText}
            </span>
          </div>

          {/* wrong → 모범 답안 (교정 + 피드백) */}
          {!graded.ok && (
            <div className="flex flex-col gap-2 rounded-[20px] bg-[#eef8f0] px-[18px] py-4">
              <div className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#00a836" strokeWidth="1.5" />
                  <path d="M5 8l2 2 4-4" stroke="#00a836" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-sans text-[14px] font-semibold" style={{ color: '#00a836' }}>
                  모범 답안
                </span>
              </div>
              <span className="font-inter text-[16px] font-medium text-ink" style={{ lineHeight: '24px' }}>
                {graded.better}
              </span>
            </div>
          )}

          {/* ok & DB 표현과 다르면 → 이렇게도 쓸 수 있어요 (DB 저장 표현) */}
          {graded.ok && showAlt && (
            <div className="flex flex-col gap-2 rounded-[20px] bg-[#eef8f0] px-[18px] py-4">
              <div className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#00a836" strokeWidth="1.5" />
                  <path d="M5 8l2 2 4-4" stroke="#00a836" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-sans text-[14px] font-medium" style={{ color: '#00a836' }}>
                  이렇게도 쓸 수 있어요
                </span>
              </div>
              <span className="font-inter text-[16px] text-ink" style={{ lineHeight: '24px' }}>
                {graded.better}
              </span>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={btnAction}
        className="mt-1 flex h-[50px] w-full shrink-0 items-center justify-center gap-2 rounded-[20px]"
        style={{ background: ready ? '#121212' : '#efefef' }}
      >
        {grading && (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,.35)" strokeWidth="2.5" />
            <path d="M9 2a7 7 0 0 1 7 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        )}
        <span className="font-sans text-[16px] font-medium" style={{ color: ready ? '#fff' : '#bdbdbd' }}>
          {btnLabel}
        </span>
      </button>
    </div>
  )
}
