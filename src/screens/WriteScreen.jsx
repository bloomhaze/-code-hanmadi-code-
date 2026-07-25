import { useRef, useState } from 'react'
import SentenceResult from '../components/SentenceResult.jsx'
import WordSearchSheet from '../components/WordSearchSheet.jsx'
import { speak, stopSpeak } from '../lib/speak.js'
import { MOCK_KO_RESULT, MOCK_EN_RESULT } from '../data/lookups.js'

const KO_RE = /[ᄀ-ᇿ㄰-㆏가-힣]/g

// 일기 작성 플로우: edit → loading → result (번역/교정).
export default function WriteScreen({ mode = 'ko', onBack, onSave, onToast, onTapWord, onTapFix, activeWord }) {
  const [step, setStep] = useState('edit') // edit | loading | result
  const [body, setBody] = useState('')
  const [data, setData] = useState(null)
  const [dm, setDm] = useState('sentence')
  const [listen, setListen] = useState({})
  const [bookmark, setBookmark] = useState({})
  const [playing, setPlaying] = useState(false)
  const [wordSheet, setWordSheet] = useState(false)
  const timer = useRef(null)

  const isEn = mode === 'en'
  const ctaActive = body.trim().length > 0

  const onBodyChange = (e) => {
    let v = e.target.value
    if (isEn) {
      const cleaned = v.replace(KO_RE, '')
      if (cleaned !== v) {
        onToast?.('영어로만 작성할 수 있어요.')
        v = cleaned
      }
      if (v.length && v[0] !== v[0].toUpperCase()) v = v[0].toUpperCase() + v.slice(1)
    } else {
      const cleaned = v.replace(/[A-Za-z]/g, '')
      if (cleaned !== v) {
        onToast?.('한글로만 작성할 수 있어요.')
        v = cleaned
      }
    }
    setBody(v)
  }

  const submit = () => {
    if (!ctaActive) return
    setStep('loading')
    timer.current = setTimeout(() => {
      setData(isEn ? MOCK_EN_RESULT : MOCK_KO_RESULT)
      setStep('result')
    }, 1300)
  }

  const togglePlay = () => {
    if (playing) {
      stopSpeak()
      setPlaying(false)
    } else {
      speak(data.allEn)
      setPlaying(true)
    }
  }
  const toggleListen = (i, text) => {
    setListen((s) => ({ ...s, [i]: !s[i] }))
    if (!listen[i]) speak(text)
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
    <div className="absolute inset-0 z-40 bg-white">
      {/* top bar */}
      <div className="absolute left-0 top-12 z-20 flex h-12 w-full items-center justify-between bg-white px-5">
        <button
          type="button"
          onClick={onBack}
          className="flex h-6 w-6 items-center justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15.7589 4.23695C16.0817 4.55288 16.0817 5.0651 15.7589 5.38103L8.9964 12L15.7589 18.619C16.0817 18.9349 16.0817 19.4471 15.7589 19.7631C15.4361 20.079 14.9128 20.079 14.59 19.7631L7.24306 12.572C6.92028 12.2561 6.92028 11.7439 7.24306 11.428L14.59 4.23695C14.9128 3.92102 15.4361 3.92102 15.7589 4.23695Z"
              fill="#121212"
            />
          </svg>
        </button>
        {step === 'result' && (
          <button type="button" onClick={onSave} className="px-1 py-0.5">
            <span className="font-sans text-[16px] font-medium text-accent" style={{ letterSpacing: '-.32px' }}>
              저장
            </span>
          </button>
        )}
        {step === 'edit' && isEn && (
          <button
            type="button"
            onClick={() => setWordSheet(true)}
            className="flex h-6 w-6 items-center justify-center"
            aria-label="단어 검색"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="4" width="14" height="14" rx="1" fill="#1A1A1B" />
              <path
                d="M5 19.5C5 19.2239 5.22386 19 5.5 19H18.5C18.7761 19 19 19.2239 19 19.5V20C19 20.2761 18.7761 20.5 18.5 20.5H6C5.44772 20.5 5 20.0523 5 19.5Z"
                fill="#1A1A1B"
              />
              <path
                d="M6 6C6.55228 6 7 6.44772 7 7L7 19.5C7 20.0523 6.55228 20.5 6 20.5C5.44772 20.5 5 20.0523 5 19.5L5 7C5 6.44771 5.44772 6 6 6Z"
                fill="#1A1A1B"
              />
              <path
                d="M10.0857 14.4014C9.96471 14.7592 9.62909 15 9.25142 15C8.64194 15 8.21674 14.3958 8.42253 13.8221L10.632 7.66236C10.7745 7.26504 11.1512 7 11.5733 7H12.4304C12.8527 7 13.2295 7.26525 13.3719 7.66279L15.5782 13.8223C15.7837 14.396 15.3584 15 14.749 15C14.3711 15 14.0354 14.7589 13.9146 14.4008L12.0449 8.8589C12.0387 8.84051 12.0214 8.82812 12.002 8.82812C11.9826 8.82812 11.9654 8.8405 11.9592 8.85888L10.0857 14.4014ZM9.7656 12.5156C9.7656 12.151 10.0612 11.8555 10.4258 11.8555H13.5539C13.9185 11.8555 14.2141 12.151 14.2141 12.5156C14.2141 12.8802 13.9185 13.1758 13.5539 13.1758H10.4258C10.0612 13.1758 9.7656 12.8802 9.7656 12.5156Z"
                fill="white"
              />
            </svg>
          </button>
        )}
      </div>

      {wordSheet && <WordSearchSheet onClose={() => setWordSheet(false)} onToast={onToast} />}

      {/* EDIT */}
      {step === 'edit' && (
        <>
          <div className="no-scrollbar absolute left-0 top-24 h-[560px] w-full overflow-y-auto bg-white">
            <div className="px-5 pt-4">
              <textarea
                value={body}
                onChange={onBodyChange}
                placeholder={isEn ? 'Write freely.' : '자유롭게 작성해주세요'}
                autoFocus
                className="min-h-[520px] w-full resize-none border-none bg-transparent font-inter text-[16px] text-ink outline-none placeholder:text-[#BFBFBF]"
                style={{ lineHeight: '30px', letterSpacing: '-.2px' }}
              />
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 z-[22] w-full px-5 pb-7 pt-3.5"
            style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0) 0%,#fff 22%)' }}
          >
            <button
              type="button"
              onClick={submit}
              className="flex h-[50px] w-full items-center justify-center gap-1.5 rounded-[20px]"
              style={{ background: ctaActive ? '#121212' : '#efefef' }}
            >
              <span
                className="font-sans text-[15px] font-medium"
                style={{ color: ctaActive ? '#fff' : '#bdbdbd', letterSpacing: '-.2px' }}
              >
                ✦ {isEn ? '교정받기' : '영어로 번역하기'}
              </span>
            </button>
          </div>
        </>
      )}

      {/* LOADING */}
      {step === 'loading' && (
        <div className="absolute left-0 top-24 flex h-[716px] w-full flex-col items-center justify-center gap-[18px] bg-white">
          <div
            className="h-10 w-10 rounded-full border-[3px] border-[#dcebff]"
            style={{ borderTopColor: '#0066ff', animation: 'spin .8s linear infinite' }}
          />
          <span
            className="whitespace-pre-line text-center font-sans text-[15px] font-medium text-muted"
            style={{ lineHeight: '22px' }}
          >
            {isEn ? '교정 중이에요\n조금만 기다려주세요' : '번역 중이에요\n조금만 기다려주세요'}
          </span>
        </div>
      )}

      {/* RESULT */}
      {step === 'result' && data && (
        <div className="no-scrollbar absolute left-0 top-24 h-[716px] w-full overflow-y-auto bg-white">
          <div className="px-5 pb-16 pt-4">
            <SentenceResult
              data={data}
              mode={dm}
              onModeChange={setDm}
              showToggle={!isEn}
              hint={isEn ? 'correction' : 'word'}
              activeWord={activeWord}
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
      )}
    </div>
  )
}
