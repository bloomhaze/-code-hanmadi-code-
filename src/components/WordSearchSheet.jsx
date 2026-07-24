import { useRef, useState } from 'react'
import { SpeakerSmall, BookmarkSmall, SearchIcon } from './icons.jsx'
import { hlSegs } from '../lib/text.js'
import { speak } from '../lib/speak.js'
import { searchExpressions } from '../data/lookups.js'

// 단어 검색 시트 — 모르는 표현을 검색해 영어 표현 제안을 받는다.
export default function WordSearchSheet({ onClose, onToast }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | results
  const [results, setResults] = useState([])
  const timer = useRef(null)

  const run = () => {
    if (!query.trim()) return
    setStatus('loading')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setResults(searchExpressions(query))
      setStatus('results')
    }, 700)
  }

  return (
    <>
      <div className="absolute inset-0 z-[56] bg-black/40" onClick={onClose} />
      <button
        type="button"
        onClick={onClose}
        className="absolute left-[327px] top-[58px] z-[58] flex h-8 w-8 items-center justify-center rounded-full"
        style={{ background: 'rgba(60,60,67,.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M1.5 1.5 12.5 12.5M12.5 1.5 1.5 12.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </button>

      <div
        className="absolute left-0 top-[106px] z-[57] h-[706px] w-full rounded-t-[22px] bg-white px-5 pt-2.5"
        style={{ animation: 'sheetUp .28s cubic-bezier(.22,1,.36,1)' }}
      >
        <div className="mx-auto mb-[18px] h-1 w-9 rounded-full bg-[#dcdcdc]" />
        <span className="font-sans text-[20px] font-semibold text-ink" style={{ letterSpacing: '-.4px' }}>
          단어 검색
        </span>
        <div className="mt-2">
          <span className="font-sans text-[14px]" style={{ color: '#b0b0b0' }}>
            모르는 단어를 검색해서 일기를 작성해보세요
          </span>
        </div>

        <div
          className="mt-4 flex h-12 items-center gap-2 rounded-2xl bg-white pl-4 pr-2"
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
            className="rounded-xl px-3 py-2"
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

        {status === 'idle' && (
          <div className="mt-24 flex flex-col items-center gap-3">
            <SearchIcon color="#dcdcdc" />
            <span className="text-center font-sans text-[14px]" style={{ color: '#c4c4c4' }}>
              표현하고 싶은 단어를 검색해보세요
            </span>
          </div>
        )}

        {status === 'results' && (
          <div className="no-scrollbar mt-5 flex max-h-[540px] flex-col gap-3 overflow-y-auto pb-6">
            {results.map((w, i) => (
              <ResultCard key={i} w={w} onToast={onToast} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function ResultCard({ w, onToast }) {
  const [saved, setSaved] = useState(false)
  const segs = hlSegs(w.ex || '', w.term)
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-[#f7f7f8] p-[18px]">
      <div className="flex items-start justify-between gap-2.5">
        <span className="font-inter text-[18px] font-semibold text-ink" style={{ letterSpacing: '-.2px' }}>
          {w.term}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => speak(`${w.term}. ${w.ex || ''}`)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eee]"
          >
            <SpeakerSmall color="#121212" />
          </button>
          <button
            type="button"
            onClick={() => {
              setSaved((s) => !s)
              onToast?.(saved ? '저장을 취소했어요' : '단어를 저장했어요')
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
