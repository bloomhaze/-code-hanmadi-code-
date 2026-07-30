import { useRef, useState } from 'react'
import { SpeakerSmall, BookmarkSmall, SearchEmptyIllust, Spinner } from './icons.jsx'
import { hlSegs } from '../lib/text.js'
import { speak, stopSpeak } from '../lib/speak.js'
import { searchExpressions } from '../lib/search.js'

// 단어 검색 시트 — 모르는 표현을 검색해 AI가 실제로 많이 쓰는 영어 표현 1~5개를 제안한다.
export default function WordSearchSheet({ onClose, onToast }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | results | error
  const [results, setResults] = useState([])
  const reqId = useRef(0)

  const run = async () => {
    const q = query.trim()
    if (!q) return
    const id = ++reqId.current
    setStatus('loading')
    try {
      const list = await searchExpressions(q)
      if (id !== reqId.current) return // 더 최근 검색이 있으면 무시
      setResults(list)
      setStatus(list.length ? 'results' : 'error')
    } catch {
      if (id !== reqId.current) return
      setStatus('error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[56] flex items-end justify-center bg-black/40 sm:items-center sm:px-5"
      onClick={onClose}
    >
      <div
        className="ws-sheet flex max-h-[85vh] w-full flex-col rounded-t-[22px] bg-white px-5 pb-4 pt-5 sm:max-w-[440px] sm:rounded-[22px]"
        style={{ paddingBottom: 'max(28px, calc(env(safe-area-inset-bottom) + 20px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="font-sans text-[20px] font-semibold text-ink" style={{ letterSpacing: '-.4px' }}>
              단어 검색
            </span>
            <span className="font-sans text-[14px]" style={{ color: '#b0b0b0' }}>
              모르는 단어를 검색해서 일기를 작성해보세요
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f1f1f2]"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M1.5 1.5 12.5 12.5M12.5 1.5 1.5 12.5" stroke="#666" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div
          className="mt-4 flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-white pl-4 pr-2"
          style={{ boxShadow: 'inset 0 0 0 1px #ededed' }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            placeholder="eg. 두근거리다"
            autoFocus
            className="min-w-0 flex-1 border-none bg-transparent font-sans text-[15px] text-ink outline-none placeholder:text-[#b0b0b0]"
          />
          <button
            type="button"
            onClick={run}
            className="flex h-8 items-center rounded-xl px-3.5"
            style={{ background: query.trim() ? '#121212' : '#f1f1f2' }}
          >
            <span className="font-sans text-[14px] font-medium" style={{ color: query.trim() ? '#fff' : '#b0b0b0' }}>
              검색
            </span>
          </button>
        </div>

        {status === 'loading' && (
          <div className="mt-16 flex justify-center">
            <div
              className="h-9 w-9 rounded-full border-[3px] border-[#e8e8e8]"
              style={{ borderTopColor: '#0066ff', animation: 'spin 1s linear infinite' }}
            />
          </div>
        )}


        {status === 'error' && (
          <div className="mt-24 flex flex-col items-center gap-2">
            <SearchEmptyIllust size={96} />
            <span className="mt-2 font-sans text-[16px] font-medium text-ink">표현을 찾지 못했어요</span>
            <span className="font-sans text-[13px] font-light text-muted-2">다시 검색해보세요</span>
          </div>
        )}

        {status === 'results' && (
          <div className="no-scrollbar mt-5 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-2">
            {results.map((w, i) => (
              <ResultCard key={i} w={w} onToast={onToast} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ResultCard({ w, onToast }) {
  const [saved, setSaved] = useState(false)
  const [audio, setAudio] = useState('idle') // idle | loading | playing
  const segs = hlSegs(w.ex || '', w.term)
  const onSpeak = () => {
    if (audio !== 'idle') {
      stopSpeak()
      setAudio('idle')
      return
    }
    setAudio('loading')
    speak(`${w.term}. ${w.ex || ''}`, () => setAudio('idle'), () => setAudio('playing'))
  }
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-[#f7f7f8] p-[18px]">
      <div className="flex items-start justify-between gap-2.5">
        <span className="font-inter text-[18px] font-semibold text-ink" style={{ letterSpacing: '-.2px' }}>
          {w.term}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onSpeak}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: audio === 'playing' ? '#0066ff' : '#eee' }}
          >
            {audio === 'loading' ? (
              <Spinner size={16} color="#121212" />
            ) : (
              <SpeakerSmall color={audio === 'playing' ? '#fff' : '#121212'} />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setSaved((s) => !s)
              onToast?.(
                saved ? '저장을 취소했어요' : '단어를 저장했어요',
                saved ? () => setSaved(true) : undefined,
                saved ? undefined : true, // 저장 성공 → 체크 아이콘
              )
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: saved ? '#0066ff' : '#eee' }}
          >
            <BookmarkSmall fill={saved ? '#fff' : 'none'} stroke={saved ? '#fff' : '#121212'} />
          </button>
        </div>
      </div>
      <span className="font-sans text-[15px] font-medium text-ink">{w.kr}</span>
      <span className="font-inter text-[14px]" style={{ lineHeight: '20px' }}>
        {segs.map((g, i) => (
          <span key={i} style={{ color: g.accent ? '#0066ff' : '#4a4a4c' }}>
            {g.t}
          </span>
        ))}
      </span>
      <span className="font-sans text-[13px] font-light" style={{ color: '#9b9b9b', lineHeight: '18px' }}>
        {w.exKr}
      </span>
    </div>
  )
}
