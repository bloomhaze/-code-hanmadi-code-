import { useMemo, useRef, useState } from 'react'
import { buildQuizList, blankAnswerFor, writeHintFor, koOf, gradeWriting } from '../data/quiz.js'

const CONFETTI = [
  ['30px', '70px', 12, 12, '50%', '#8ee06b', '2.6s', '0s'],
  ['120px', '20px', 14, 14, '0', '#ffd23f', '2.9s', '.2s'],
  ['200px', '50px', 10, 18, '0', '#f5a2e0', '3.1s', '.5s'],
  ['290px', '30px', 13, 13, '50%', '#3d8bff', '2.7s', '.1s'],
  ['340px', '90px', 14, 6, '0', '#8ecdff', '3.0s', '.35s'],
  ['60px', '140px', 15, 15, '0', '#ffd23f', '3.2s', '.6s'],
  ['250px', '130px', 11, 11, '50%', '#8ee06b', '2.8s', '.15s'],
  ['150px', '170px', 12, 20, '0', '#f5a2e0', '3.3s', '.45s'],
  ['20px', '220px', 13, 13, '50%', '#3d8bff', '3.0s', '.25s'],
  ['320px', '200px', 14, 14, '0', '#ffd23f', '2.9s', '.55s'],
  ['90px', '280px', 10, 16, '0', '#8ecdff', '3.1s', '.3s'],
  ['280px', '300px', 12, 12, '50%', '#f5a2e0', '3.4s', '.5s'],
]

export default function QuizScreen({ type = 'flash', onClose, onToast }) {
  const initial = useMemo(() => buildQuizList(type, 1), [type])
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
    const more = buildQuizList(type, list.length + 7)
    setList(list.concat(more))
    setQi(list.length)
    setDone(false)
    resetPerQuestion()
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
        <span className="z-[2] mt-2.5 text-center font-sans text-[15px] text-muted" style={{ lineHeight: '22px' }}>
          오늘의 복습을 완료했어요
        </span>
        <span className="z-[2] mt-1.5 font-sans text-[14px]" style={{ color: '#c0c0c0' }}>
          맞은 개수 {right} · 틀린 개수 {wrong}
        </span>
        <button
          type="button"
          onClick={hasWrong ? retryWrong : continueMore}
          className="absolute bottom-9 left-5 z-[2] flex h-[50px] w-[335px] items-center justify-center rounded-[20px] bg-ink"
        >
          <span className="font-sans text-[16px] font-medium text-white">
            {hasWrong ? `틀린 ${wrong}개, 다시 복습` : '이어서 더 복습하기'}
          </span>
        </button>
      </div>
    )
  }

  // ---- shared header ----
  const Header = () => (
    <div className="absolute left-0 top-12 z-[2] flex h-[60px] w-full items-center gap-3.5 px-5">
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
    <div className="absolute inset-0 z-40 bg-white">
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
    <>
      {/* side toggle */}
      <div className="absolute left-0 top-24 flex h-[60px] w-full items-center justify-center px-5 pb-2.5 pt-3.5">
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
        className="absolute left-5 top-[176px] box-border flex h-[506px] w-[335px] flex-col rounded-3xl p-7"
        style={{
          background: revealed ? '#5f5f5f' : '#fff',
          border: revealed ? 'none' : '1px solid #eee',
          boxShadow: '0 4px 20px rgba(17,17,26,.05)',
          transition: 'background .25s ease',
        }}
      >
        <div className="flex grow flex-col items-center justify-center">
          <span
            className="text-center text-[28px] font-normal"
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
      <div className="absolute left-0 top-[698px] box-border flex h-[90px] w-full items-center gap-3 px-5 pb-5 pt-[18px]">
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
    </>
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

  const pillInk = !blankChecked ? '#121212' : correct ? '#00a836' : '#ff4242'
  const pillBg = !blankChecked ? '#f1f5ff' : correct ? '#e7f7ec' : '#ffecec'

  return (
    <>
      <div className="absolute left-5 top-[120px] box-border flex h-[562px] w-[335px] flex-col items-center rounded-3xl border border-[#eee] bg-white px-[26px] pb-6 pt-7" style={{ boxShadow: '0 4px 20px rgba(17,17,26,.05)' }}>
        <div className="flex grow flex-col items-start justify-center gap-4 self-stretch">
          <span className="text-left font-sans text-[16px] font-normal" style={{ color: 'rgba(46,47,51,.6)', letterSpacing: '-.2px' }}>
            {ko}
          </span>
          <div className="flex flex-wrap items-center font-inter text-[22px] font-bold text-ink" style={{ letterSpacing: '-.3px', lineHeight: 1.5 }}>
            <span className="font-medium" style={{ whiteSpace: 'pre-wrap' }}>
              {pre}
            </span>
            <span
              className="mx-0.5 inline-flex min-h-[32px] items-center rounded-[9px] px-2.5"
              style={{ background: pillBg }}
            >
              <input
                value={blank}
                onChange={(e) => setBlank(e.target.value)}
                disabled={blankChecked}
                size={Math.max(blank.length || answer.length, 4)}
                autoFocus
                className="border-none bg-transparent text-left font-inter text-[22px] font-bold outline-none"
                style={{ letterSpacing: '-.3px', color: pillInk, caretColor: '#2f6bff', width: `${Math.max(blank.length, 4)}ch` }}
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

      <div className="absolute left-0 top-[709px] box-border w-full px-5 pb-[18px] pt-3.5" style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0) 0%,#fff 18%)' }}>
        <button
          type="button"
          onClick={btnAction}
          className="flex h-12 w-full items-center justify-center rounded-[20px]"
          style={{ background: ready ? '#121212' : '#efefef' }}
        >
          <span className="font-sans text-[15px] font-medium" style={{ color: ready ? '#fff' : '#bdbdbd', letterSpacing: '-.2px' }}>
            {btnLabel}
          </span>
        </button>
      </div>
    </>
  )
}

/* ---------------- Writing ---------------- */
function WriteQuiz({ cur, writeText, setWriteText, hint, setHint, grading, setGrading, graded, setGraded, gradeTimer, applyMark, next, qi, total }) {
  const ko = koOf(cur)
  const expr = writeHintFor(cur)

  const doGrade = () => {
    if (!writeText.trim()) return
    setGrading(true)
    clearTimeout(gradeTimer.current)
    gradeTimer.current = setTimeout(() => {
      const res = gradeWriting(cur, writeText)
      setGraded(res)
      setGrading(false)
      applyMark(res.ok)
    }, 1000)
  }
  const btnAction = grading ? () => {} : graded ? next : doGrade
  const btnLabel = grading ? 'AI 첨삭 중' : graded ? (qi >= total - 1 ? '완료' : '다음') : '정답 확인'
  const ready = grading || graded || writeText.trim()

  return (
    <>
      <div className="absolute left-5 top-[120px] box-border flex w-[335px] flex-col gap-1.5 rounded-2xl bg-[#f5f5f6] px-5 py-[18px]">
        <span className="font-sans text-[14px] font-normal text-muted">이 문장을 영작해보세요</span>
        <span className="font-sans text-[16px] font-medium text-ink" style={{ lineHeight: '26px' }}>
          {ko}
        </span>
      </div>

      <div className="absolute left-5 top-[230px] flex min-h-[34px] w-[335px] items-center gap-2.5">
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
        <div className="absolute left-5 top-[282px] box-border h-[404px] w-[335px] rounded-[20px] bg-white p-[18px]" style={{ boxShadow: 'inset 0 0 0 1px #ececee' }}>
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
        <div className="no-scrollbar absolute left-5 top-[282px] flex max-h-[404px] w-[335px] flex-col gap-3.5 overflow-y-auto">
          <div
            className="flex flex-col gap-2.5 rounded-[20px] bg-white px-[18px] py-4"
            style={{ boxShadow: `inset 0 0 0 1.5px ${graded.ok ? '#bfe6cb' : '#ffd0d0'}` }}
          >
            <div className="flex items-center gap-1.5">
              {graded.ok ? (
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#00a836" strokeWidth="1.5" />
                  <path d="M5 8l2 2 4-4" stroke="#00a836" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#ff4242" strokeWidth="1.5" />
                  <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#ff4242" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
              <span className="font-sans text-[14px] font-medium" style={{ color: graded.ok ? '#00a836' : '#ff4242' }}>
                {graded.ok ? '자연스러워요' : '조금 아쉬워요'}
              </span>
            </div>
            <span className="font-inter text-[16px] text-ink" style={{ lineHeight: '24px' }}>
              {writeText}
            </span>
          </div>
          <div className="flex flex-col gap-2 rounded-[20px] bg-[#eef8f0] px-[18px] py-4">
            <div className="flex items-center gap-1.5">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
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
            <span className="font-sans text-[13px] font-medium" style={{ color: '#2fa84f', lineHeight: '20px' }}>
              {graded.feedback}
            </span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={btnAction}
        className="absolute left-5 top-[730px] flex h-[50px] w-[335px] items-center justify-center gap-2 rounded-[20px]"
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
    </>
  )
}
