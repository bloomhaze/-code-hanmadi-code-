import { useState } from 'react'
import { SpeakerSmall, BookmarkSmall, Spinner } from './icons.jsx'
import { hlSegs } from '../lib/text.js'
import { speak, stopSpeak } from '../lib/speak.js'

// Bottom-sheet showing a tapped word's meaning + example (단어 뜻 팝업).
export default function WordPopup({ state, saved = false, onToggleSave, onClose, onToast }) {
  const [audio, setAudio] = useState('idle') // idle | loading | playing
  if (!state?.open) return null
  const { term, loading, kr, ex, exKr } = state
  const segs = hlSegs(ex || '', term)

  const onSpeak = () => {
    if (audio !== 'idle') {
      stopSpeak()
      setAudio('idle')
      return
    }
    setAudio('loading')
    speak(
      `${term}. ${ex || ''}`,
      () => setAudio('idle'),
      () => setAudio('playing'),
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 px-5" onClick={onClose}>
      <div
        className="w-full max-w-[440px] rounded-[20px] bg-white px-5 pb-6 pt-6"
        style={{ animation: 'scaleIn .24s cubic-bezier(.22,1,.36,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-h-8 items-center justify-between gap-3">
          <span
            className="font-inter text-[22px] font-semibold leading-none text-ink-2"
            style={{ letterSpacing: '-.3px', transform: 'translateY(1px)' }}
          >
            {term}
          </span>
          <div className="flex shrink-0 gap-2.5">
            <button
              type="button"
              onClick={onSpeak}
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: audio === 'playing' ? '#0066ff' : '#f1f1f2' }}
            >
              {audio === 'loading' ? (
                <Spinner size={16} color="#121212" />
              ) : (
                <SpeakerSmall color={audio === 'playing' ? '#fff' : '#121212'} />
              )}
            </button>
            <button
              type="button"
              onClick={() => (loading ? null : onToggleSave?.())}
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: saved ? '#0066ff' : '#f1f1f2' }}
            >
              <BookmarkSmall fill={saved ? '#fff' : 'none'} stroke={saved ? '#fff' : '#121212'} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2.5 py-3">
            <div
              className="h-5 w-5 rounded-full border-[2.5px] border-[#e6e6e6]"
              style={{ borderTopColor: '#0066ff', animation: 'spin .8s linear infinite' }}
            />
            <span className="font-sans text-[14px] font-medium text-muted">뜻과 예문을 찾고 있어요</span>
          </div>
        ) : (
          <>
            <div className="mt-[7px] py-0.5">
              <span className="font-sans text-[16px] font-medium text-ink-2" style={{ lineHeight: '100%' }}>
                {kr}
              </span>
            </div>
            {ex && (
              <div className="mt-4 flex flex-col gap-1.5 rounded-2xl bg-[#f7f7f7] p-4">
                <span className="font-inter text-[15px] text-ink" style={{ lineHeight: '20.8px' }}>
                  {segs.map((g, i) => (
                    <span key={i} style={{ color: g.accent ? '#0066ff' : '#121212' }}>
                      {g.t}
                    </span>
                  ))}
                </span>
                <span className="font-sans text-[14px] font-light text-sub" style={{ lineHeight: '20.8px' }}>
                  {exKr}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
