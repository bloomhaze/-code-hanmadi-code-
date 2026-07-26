import { useEffect, useState } from 'react'
import SentenceResult from '../components/SentenceResult.jsx'
import { speak, stopSpeak } from '../lib/speak.js'
import { getEntry } from '../data/diary.js'

// 일기 상세 — 문장별 / 전체 보기 + 교정 사유. Reuses SentenceResult.
export default function DiaryDetailScreen({ id, entry: passedEntry, onBack, onDelete, onToast, onTapWord, onTapFix, activeWord, activeFix }) {
  // 실제 저장한 일기면 그 엔트리를, 아니면 mock(id 조회).
  const entry = passedEntry || getEntry(id)
  const [dm, setDm] = useState('sentence')
  const [bookmark, setBookmark] = useState({})
  const [playId, setPlayId] = useState(null) // null | 'all' | 문장 index (하나만 재생)

  // 화면을 벗어나면 재생 중이던 음성 정지
  useEffect(() => () => stopSpeak(), [])

  if (!entry) return null
  const isCorrection = !!entry.correction

  const playing = playId === 'all'
  const listen = typeof playId === 'number' ? { [playId]: true } : {}

  // 전체 듣기 / 문장별 듣기 — 한 번에 하나만, 다시 누르면 정지, 끝나면 자동 off.
  const togglePlay = () => {
    if (playId === 'all') {
      stopSpeak()
      setPlayId(null)
      return
    }
    setPlayId('all')
    speak(entry.allEn, () => setPlayId((c) => (c === 'all' ? null : c)))
  }
  const toggleListen = (i, text) => {
    if (playId === i) {
      stopSpeak()
      setPlayId(null)
      return
    }
    setPlayId(i)
    speak(text, () => setPlayId((c) => (c === i ? null : c)))
  }
  const toggleBookmark = (i) => {
    const was = bookmark[i]
    setBookmark((s) => ({ ...s, [i]: !s[i] }))
    onToast?.(
      was ? '저장을 취소했어요' : '표현을 저장했어요',
      was ? () => setBookmark((s) => ({ ...s, [i]: true })) : undefined,
    )
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white">
      {/* top bar */}
      <div className="relative flex h-12 shrink-0 items-center justify-between bg-white px-5 pt-4">
        <button type="button" onClick={onBack} className="relative z-[2] flex h-6 w-6 items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15.7589 4.23695C16.0817 4.55288 16.0817 5.0651 15.7589 5.38103L8.9964 12L15.7589 18.619C16.0817 18.9349 16.0817 19.4471 15.7589 19.7631C15.4361 20.079 14.9128 20.079 14.59 19.7631L7.24306 12.572C6.92028 12.2561 6.92028 11.7439 7.24306 11.428L14.59 4.23695C14.9128 3.92102 15.4361 3.92102 15.7589 4.23695Z"
              fill="#121212"
            />
          </svg>
        </button>
        <span
          className="pointer-events-none absolute inset-x-0 text-center font-inter text-[18px] font-medium text-ink"
          style={{ letterSpacing: '-.36px' }}
        >
          {entry.title}
        </span>
        <button type="button" onClick={onDelete} className="relative z-[2] px-1 py-0.5">
          <span className="font-sans text-[16px] text-muted" style={{ letterSpacing: '-.32px' }}>
            삭제
          </span>
        </button>
      </div>

      {/* body */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto bg-white">
        <div className="px-5 pb-16 pt-4">
          <SentenceResult
            data={entry}
            mode={dm}
            onModeChange={setDm}
            showToggle={!isCorrection}
            hint={isCorrection ? 'correction' : 'word'}
            activeWord={activeWord}
            activeFix={activeFix}
            onTapWord={onTapWord}
            onTapFix={onTapFix}
            listen={listen}
            onListen={toggleListen}
            bookmark={bookmark}
            onBookmark={toggleBookmark}
            playing={playing}
            onTogglePlay={togglePlay}
          />
        </div>
      </div>
    </div>
  )
}
