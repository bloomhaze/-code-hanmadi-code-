import { useEffect, useMemo, useState } from 'react'
import {
  SearchIcon,
  SpeakerSmall,
  BookmarkSmall,
  LockIcon,
  PlayIcon,
  PencilIcon,
} from '../components/icons.jsx'
import { hlSegs } from '../lib/text.js'
import { VOCAB_DATA } from '../data/vocab.js'
import { speak } from '../lib/speak.js'

const ACCENT = '#0066FF'
const TABS = [
  { key: 'word', label: '단어' },
  { key: 'phrase', label: '표현' },
  { key: 'sentence', label: '문장' },
]

// 단어장 탭 — Quick Quiz card, filter chips, and saved word/phrase/sentence cards.
export default function VocabScreen({ onWrite, onToast, onStartQuiz, locked = false }) {
  const [tab, setTab] = useState('word')
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [listen, setListen] = useState({})
  const [bookmark, setBookmark] = useState({}) // key -> bool (default saved/true)
  const [rollIdx, setRollIdx] = useState(0)

  const counts = {
    word: VOCAB_DATA.word.length,
    phrase: VOCAB_DATA.phrase.length,
    sentence: VOCAB_DATA.sentence.length,
  }
  const total = counts.word + counts.phrase + counts.sentence
  const hasSaved = total > 0

  // rolling quiz word from saved words + phrases
  const quizPool = useMemo(
    () => [...VOCAB_DATA.word, ...VOCAB_DATA.phrase].map((x) => x.term).filter(Boolean),
    [],
  )
  useEffect(() => {
    if (quizPool.length < 2) return
    const t = setInterval(() => setRollIdx((i) => (i + 1) % quizPool.length), 2600)
    return () => clearInterval(t)
  }, [quizPool.length])
  const quizWord = quizPool.length ? quizPool[rollIdx % quizPool.length] : ''

  const q = query.trim().toLowerCase()
  const matches = (it) =>
    !q ||
    (it.term && it.term.toLowerCase().includes(q)) ||
    (it.kr && it.kr.toLowerCase().includes(q)) ||
    (it.ko && it.ko.toLowerCase().includes(q))

  const items = (VOCAB_DATA[tab] || [])
    .map((it, oi) => ({ it, key: `${tab}-${oi}` }))
    .filter(({ it }) => matches(it))

  const isSaved = (key) => (bookmark[key] === undefined ? true : bookmark[key])
  const toggleListen = (key, text) => {
    setListen((s) => ({ ...s, [key]: !s[key] }))
    if (!listen[key]) speak(text)
  }
  const toggleBookmark = (key) => {
    const cur = isSaved(key)
    setBookmark((s) => ({ ...s, [key]: !cur }))
    if (cur) onToast?.('저장을 취소했어요')
  }

  return (
    <>
      {/* header */}
      <div className="absolute left-0 top-12 z-20 flex h-12 w-full items-center justify-between bg-white px-5">
        <span className="font-sans text-[20px] font-semibold text-ink" style={{ letterSpacing: '-.4px' }}>
          단어장
        </span>
        {hasSaved && (
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: searchOpen ? '#f1f1f2' : 'transparent' }}
          >
            <SearchIcon />
          </button>
        )}
      </div>

      {/* content */}
      <div className="no-scrollbar absolute left-0 top-24 h-[628px] w-full overflow-y-auto bg-white">
        <div className="flex flex-col px-5 pb-[120px] pt-3">
          {searchOpen && (
            <div
              className="-mt-1.5 mb-6 flex h-12 items-center rounded-2xl px-3.5"
              style={{ boxShadow: 'inset 0 0 0 1px #ececee' }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="단어 · 표현 · 뜻 검색"
                autoFocus
                className="w-full border-none bg-transparent font-sans text-[15px] text-ink outline-none placeholder:text-[#b0b0b0]"
              />
            </div>
          )}

          {/* Quick Quiz card */}
          <div
            className="flex flex-col gap-2 overflow-hidden rounded-[20px] p-5"
            style={{ background: 'linear-gradient(180deg,#0066ff 0%,#2e82ff 84%)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-[30px] items-center gap-1.5 rounded-full bg-white pl-2.5 pr-3">
                <span className="font-inter text-[12px] text-accent">✦</span>
                <span
                  className="font-inter text-[12px] font-bold text-accent"
                  style={{ letterSpacing: '-.2px' }}
                >
                  Quick Quiz !
                </span>
              </div>
              {hasSaved && (
                <span className="font-inter text-[13px]" style={{ color: 'rgba(255,255,255,.5)' }}>
                  {Math.min(total, 10)}개
                </span>
              )}
            </div>

            {hasSaved ? (
              <>
                <span
                  className="mt-1.5 font-sans text-[13px] font-medium"
                  style={{ color: 'rgba(255,255,255,.7)' }}
                >
                  이거 뭐였더라?
                </span>
                <span
                  className="flex h-[30px] items-center overflow-hidden font-inter text-[22px] font-medium text-white"
                  style={{ lineHeight: '29.7px', letterSpacing: '-.5px' }}
                >
                  <span key={rollIdx} style={{ display: 'inline-block', animation: 'rollUp .5s cubic-bezier(.22,1,.36,1)' }}>
                    {quizWord}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    locked ? onToast?.('프리미엄에서 무제한으로 복습할 수 있어요') : onStartQuiz?.()
                  }
                  className="mt-2 flex h-[50px] items-center justify-center gap-2 rounded-[20px] bg-ink"
                >
                  {locked ? <LockIcon /> : <PlayIcon />}
                  <span className="font-sans text-[15px] font-medium text-white">
                    {locked ? '프리미엄 구독하기' : '퀴즈 시작'}
                  </span>
                </button>
              </>
            ) : (
              <>
                <span
                  className="mt-2 font-sans text-[22px] font-semibold text-white"
                  style={{ lineHeight: '29.7px', letterSpacing: '-.5px' }}
                >
                  아직 풀 퀴즈가 없어요
                </span>
                <span
                  className="-mt-0.5 font-sans text-[14px] font-light"
                  style={{ color: 'rgba(255,255,255,.7)', lineHeight: '19px' }}
                >
                  일기를 쓰고 단어 · 표현을 저장하면
                  <br />
                  복습 퀴즈가 매일 생성돼요
                </span>
                <button
                  type="button"
                  onClick={onWrite}
                  className="mt-2 flex h-[51px] items-center justify-center gap-2 rounded-3xl bg-ink"
                >
                  <PencilIcon size={16} />
                  <span className="font-sans text-[15px] font-medium text-white">일기 쓰기</span>
                </button>
              </>
            )}
          </div>

          {/* filter chips */}
          <div className="mb-3.5 mt-8 flex gap-1.5">
            {TABS.map((t) => {
              const active = tab === t.key
              return (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="flex h-8 items-center gap-1.5 rounded-full px-4"
                  style={{ background: active ? '#121212' : '#f7f7f7' }}
                >
                  <span
                    className="font-sans text-[13px] font-medium"
                    style={{ color: active ? '#fff' : '#b0b0b0' }}
                  >
                    {t.label}
                  </span>
                  <span
                    className="font-inter text-[13px] font-medium"
                    style={{ color: active ? '#fff' : '#b0b0b0' }}
                  >
                    {counts[t.key]}
                  </span>
                </button>
              )
            })}
          </div>

          {/* cards */}
          <div className="flex flex-col gap-3">
            {items.map(({ it, key }) => {
              const saved = isSaved(key)
              const ls = !!listen[key]
              if (it.kind === 'sentence') {
                return (
                  <div
                    key={key}
                    className="flex flex-col gap-[7px] rounded-[20px] bg-[#f7f7f7] p-4"
                    style={{ boxShadow: 'inset 0 0 0 .5px #eee' }}
                  >
                    <span className="mb-0.5 font-sans text-[14px] font-normal leading-5 text-muted">
                      {it.ko}
                    </span>
                    <span
                      className="font-inter text-[16px] font-medium text-ink"
                      style={{ lineHeight: '28px', letterSpacing: '-.3px' }}
                    >
                      {it.term}
                    </span>
                    <div className="mt-2 flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => toggleListen(key, it.term)}
                        className="flex h-9 w-9 items-center justify-center rounded-full"
                        style={{ background: ls ? ACCENT : '#eee' }}
                      >
                        <SpeakerSmall color={ls ? '#fff' : '#121212'} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBookmark(key)}
                        className="flex h-9 w-9 items-center justify-center rounded-full"
                        style={{ background: saved ? ACCENT : '#eee' }}
                      >
                        <BookmarkSmall
                          fill={saved ? '#fff' : 'none'}
                          stroke={saved ? '#fff' : '#121212'}
                        />
                      </button>
                    </div>
                  </div>
                )
              }
              // word / phrase card
              const segs = hlSegs(it.ex, it.term)
              return (
                <div
                  key={key}
                  className="flex flex-col gap-[7px] rounded-[20px] bg-[#f7f7f7] p-4"
                  style={{ boxShadow: 'inset 0 0 0 .5px #eee' }}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <span
                      className="font-inter text-[18px] font-medium text-ink-2"
                      style={{ lineHeight: '100%', letterSpacing: '-.3px' }}
                    >
                      {it.term}
                    </span>
                    <div className="flex shrink-0 gap-2.5">
                      <button
                        type="button"
                        onClick={() => toggleListen(key, `${it.term}. ${it.ex || ''}`)}
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{ background: ls ? ACCENT : '#eee' }}
                      >
                        <SpeakerSmall color={ls ? '#fff' : '#121212'} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBookmark(key)}
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{ background: saved ? ACCENT : '#eee' }}
                      >
                        <BookmarkSmall
                          fill={saved ? '#fff' : 'none'}
                          stroke={saved ? '#fff' : '#121212'}
                        />
                      </button>
                    </div>
                  </div>
                  <span
                    className="font-sans text-[15px] font-semibold text-ink-2"
                    style={{ lineHeight: '100%' }}
                  >
                    {it.kr}
                  </span>
                  {it.ex && (
                    <div className="mt-1.5 flex flex-col gap-0.5">
                      <div className="font-inter text-[14px] font-normal" style={{ lineHeight: '20.8px' }}>
                        {segs.map((g, i) => (
                          <span key={i} style={{ color: g.accent ? '#0066ff' : '#737373' }}>
                            {g.t}
                          </span>
                        ))}
                      </div>
                      <span
                        className="font-sans text-[13px] font-light text-sub"
                        style={{ lineHeight: '20.8px' }}
                      >
                        {it.exKr}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {items.length === 0 && (
            <div className="mt-[120px] flex flex-col items-center gap-2">
              <span className="font-sans text-[16px] font-medium text-ink">저장한 내용이 없어요</span>
              <span className="font-sans text-[13px] font-light text-muted-2">
                내 이야기로 영어 공부를 시작해보세요
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
