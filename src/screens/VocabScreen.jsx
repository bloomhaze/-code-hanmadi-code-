import { useEffect, useMemo, useRef, useState } from 'react'
import {
  SearchIcon,
  SpeakerSmall,
  BookmarkSmall,
  PlayIcon,
  PencilIcon,
  Spinner,
  SearchEmptyIllust,
  SavedEmptyIllust,
} from '../components/icons.jsx'
import { hlSegs } from '../lib/text.js'
import { speak, stopSpeak } from '../lib/speak.js'

const ACCENT = '#0066FF'
const TABS = [
  { key: 'word', label: '단어' },
  { key: 'phrase', label: '표현' },
  { key: 'sentence', label: '문장' },
]

// 단어장 탭 — 유저가 저장한 표현(saved)을 단어/표현/문장으로 나눠 보여준다.
export default function VocabScreen({ saved = [], onUnsaveCommit, onWrite, onToast, onStartQuiz }) {
  const [tab, setTab] = useState('word')
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [playing, setPlaying] = useState(null) // 현재 재생 중인 카드 key (하나만)
  const [loadingKey, setLoadingKey] = useState(null) // 음성 로딩 중인 카드 key
  const [rollIdx, setRollIdx] = useState(0)

  // 저장 취소는 "이번 방문 동안 보류(pending)" — 카드는 남고 북마크만 off,
  // 되돌리기는 pending 해제(같은 카드), 화면을 벗어날 때 실제 DB 삭제를 커밋한다.
  const [pending, setPending] = useState(() => new Set())
  const pendingRef = useRef(pending)
  pendingRef.current = pending
  useEffect(
    () => () => {
      const ids = Array.from(pendingRef.current)
      if (ids.length) onUnsaveCommit?.(ids)
    },
    [], // 언마운트 시 1회 커밋
  )

  // 저장 표현을 타입별로 그룹핑
  const byType = useMemo(() => {
    const g = { word: [], phrase: [], sentence: [] }
    saved.forEach((it) => {
      if (g[it.type]) g[it.type].push(it)
    })
    return g
  }, [saved])
  const counts = {
    word: byType.word.length,
    phrase: byType.phrase.length,
    sentence: byType.sentence.length,
  }
  const total = saved.length
  const hasSaved = total > 0

  // rolling quiz word from saved words + phrases
  const quizPool = useMemo(
    () => [...byType.word, ...byType.phrase].map((x) => x.term).filter(Boolean),
    [byType],
  )
  useEffect(() => {
    if (quizPool.length < 2) return
    const t = setInterval(() => setRollIdx((i) => (i + 1) % quizPool.length), 2600)
    return () => clearInterval(t)
  }, [quizPool.length])
  const quizWord = quizPool.length ? quizPool[rollIdx % quizPool.length] : ''

  // 화면을 벗어나면(탭 전환 등) 재생 중이던 음성을 멈춘다.
  useEffect(() => () => stopSpeak(), [])

  const q = query.trim().toLowerCase()
  const matches = (it) =>
    !q ||
    (it.term && it.term.toLowerCase().includes(q)) ||
    (it.kr && it.kr.toLowerCase().includes(q)) ||
    (it.ko && it.ko.toLowerCase().includes(q))

  const items = (byType[tab] || [])
    .map((it) => ({ it, key: it.id }))
    .filter(({ it }) => matches(it))

  // 켜면 로딩→재생(파랑), 다시 누르면 멈춤, 다 들으면 자동 off. 한 번에 하나만.
  const toggleListen = (key, text) => {
    if (playing === key || loadingKey === key) {
      stopSpeak()
      setPlaying(null)
      setLoadingKey(null)
      return
    }
    setLoadingKey(key)
    setPlaying(null)
    speak(
      text,
      () => setPlaying((cur) => (cur === key ? null : cur)),
      () => {
        setLoadingKey((cur) => (cur === key ? null : cur))
        setPlaying(key)
      },
    )
  }
  // 북마크 토글 — 취소는 DB 즉시 삭제 대신 pending에 넣고(카드 유지), 되돌리기 토스트.
  // 되돌리기(또는 다시 클릭)는 pending 해제 → 같은 카드 북마크 on (새 카드 X).
  const toggleBookmark = (it) => {
    setPending((prev) => {
      const n = new Set(prev)
      if (n.has(it.id)) {
        n.delete(it.id) // 이미 취소 상태 → 다시 저장(북마크 on)
      } else {
        n.add(it.id) // 취소(보류) → 북마크 off, 카드는 유지
        onToast?.('저장을 취소했어요', () =>
          setPending((p) => {
            const m = new Set(p)
            m.delete(it.id)
            return m
          }),
        )
      }
      return n
    })
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* header */}
      <div className="flex h-12 shrink-0 items-center justify-between bg-white px-5 pt-4">
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
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto bg-white">
        <div className="flex flex-col px-5 pb-8 pt-3">
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
                  className="flex h-[30px] items-center overflow-hidden font-inter text-[22px] font-semibold text-white"
                  style={{ lineHeight: '29.7px', letterSpacing: '-.5px' }}
                >
                  <span key={rollIdx} style={{ display: 'inline-block', animation: 'rollUp .5s cubic-bezier(.22,1,.36,1)' }}>
                    {quizWord}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onStartQuiz?.()}
                  className="mt-2 flex h-[50px] items-center justify-center gap-2 rounded-[20px] bg-ink"
                >
                  <PlayIcon />
                  <span className="font-sans text-[15px] font-semibold text-white">퀴즈 시작</span>
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
                    className={`font-sans text-[13px] ${active ? 'font-semibold' : 'font-medium'}`}
                    style={{ color: active ? '#fff' : '#b0b0b0' }}
                  >
                    {t.label}
                  </span>
                  <span
                    className={`font-inter text-[13px] ${active ? 'font-semibold' : 'font-medium'}`}
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
              const saved = !pending.has(it.id) // 취소(pending)면 북마크 off, 카드는 유지
              const ls = playing === key
              const lo = loadingKey === key
              if (it.type === 'sentence') {
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
                      className="font-inter text-[16px] font-semibold text-ink"
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
                        {lo ? <Spinner size={17} color="#121212" /> : <SpeakerSmall color={ls ? '#fff' : '#121212'} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBookmark(it)}
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
                      className="font-inter text-[18px] font-semibold text-ink-2"
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
                        {lo ? <Spinner size={16} color="#121212" /> : <SpeakerSmall color={ls ? '#fff' : '#121212'} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBookmark(it)}
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
                    style={{ lineHeight: '22px' }}
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

          {/* search yielded nothing */}
          {items.length === 0 && q && (
            <div className="mt-[96px] flex flex-col items-center gap-2">
              <SearchEmptyIllust size={96} />
              <span className="mt-2 font-sans text-[16px] font-medium text-ink">검색 결과가 없어요</span>
              <span className="font-sans text-[13px] font-light text-muted-2">
                찾으시는 단어,표현,문장이 없어요
              </span>
            </div>
          )}

          {/* nothing saved at all */}
          {items.length === 0 && !q && (
            <div className="mt-[96px] flex flex-col items-center gap-2">
              <SavedEmptyIllust size={96} />
              <span className="mt-2 font-sans text-[16px] font-medium text-ink">저장한 내용이 없어요</span>
              <span className="font-sans text-[13px] font-light text-muted-2">
                내 이야기로 영어 공부를 시작해보세요
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
