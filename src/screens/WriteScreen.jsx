import { useEffect, useRef, useState } from 'react'
import SentenceResult from '../components/SentenceResult.jsx'
import WordSearchSheet from '../components/WordSearchSheet.jsx'
import { speak, stopSpeak } from '../lib/speak.js'
import { MOCK_KO_RESULT, MOCK_EN_RESULT } from '../data/lookups.js'
import { randomTopic } from '../data/writeTopics.js'
import { translateOrCorrect } from '../lib/write.js'

const KO_RE = /[ᄀ-ᇿ㄰-㆏가-힣]/g

// 일기 작성 플로우: edit → loading → result (번역/교정).
export default function WriteScreen({ mode = 'ko', onBack, onSave, onToast, onTapWord, onTapFix, onSaveExpr, activeWord, activeFix }) {
  const [step, setStep] = useState('edit') // edit | loading | result
  const [body, setBody] = useState('')
  const [data, setData] = useState(null)
  const [dm, setDm] = useState('sentence')
  const [bookmark, setBookmark] = useState({})
  const [playId, setPlayId] = useState(null) // null | 'all' | 문장 index (하나만 재생)
  const [loadId, setLoadId] = useState(null) // null | 'all' | 문장 index (음성 로딩 중)
  const [wordSheet, setWordSheet] = useState(false)
  const timer = useRef(null)

  const playing = playId === 'all'
  const loadingAll = loadId === 'all'
  const listen = typeof playId === 'number' ? { [playId]: true } : {}
  const loading = typeof loadId === 'number' ? { [loadId]: true } : {}

  // 화면을 벗어나면 재생 중이던 음성 정지
  useEffect(() => () => stopSpeak(), [])

  // 작성 주제 — 카테고리별 질문 풀에서 랜덤. 새로고침 시 직전과 다른 카테고리에서
  // 뽑고(같은 카테고리 연속 X), 카테고리는 노출하지 않고 질문만 보여준다. X로 닫기.
  const [topicOn, setTopicOn] = useState(true)
  const [topic, setTopic] = useState(() => randomTopic())
  const shuffleTopic = () => setTopic((t) => randomTopic(t.cat))

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

  const submit = async () => {
    if (!ctaActive || step === 'loading') return
    setStep('loading')
    try {
      const result = await translateOrCorrect(body, mode)
      setData(result)
      setStep('result')
    } catch (e) {
      // 원인을 화면에 노출하고 편집 화면으로 복귀 (조용한 mock 폴백 제거)
      onToast?.((isEn ? '교정 실패: ' : '번역 실패: ') + (e?.message || '알 수 없는 오류'))
      setStep('edit')
    }
  }

  // 전체 듣기 / 문장별 듣기 — 한 번에 하나만, 다시 누르면 정지, 끝나면 자동 off.
  const togglePlay = () => {
    if (playId === 'all' || loadId === 'all') {
      stopSpeak()
      setPlayId(null)
      setLoadId(null)
      return
    }
    setLoadId('all')
    setPlayId(null)
    speak(
      data.allEn,
      () => setPlayId((c) => (c === 'all' ? null : c)),
      () => {
        setLoadId((c) => (c === 'all' ? null : c))
        setPlayId('all')
      },
    )
  }
  const toggleListen = (i, text) => {
    if (playId === i || loadId === i) {
      stopSpeak()
      setPlayId(null)
      setLoadId(null)
      return
    }
    setLoadId(i)
    setPlayId(null)
    speak(
      text,
      () => setPlayId((c) => (c === i ? null : c)),
      () => {
        setLoadId((c) => (c === i ? null : c))
        setPlayId(i)
      },
    )
  }
  // 문장 표현 저장 — 교정문은 fixSegs 합침, 번역문은 en.
  const sentText = (s) => (s?.correction ? (s.fixSegs || []).map((g) => g.t).join('') : s?.en || '')
  const toggleBookmark = (i) => {
    const s = data?.sentences?.[i]
    if (!s) return
    setBookmark((m) => ({ ...m, [i]: !m[i] })) // 즉각 표시(옵티미스틱)
    onSaveExpr?.({ type: 'sentence', term: sentText(s), data: { ko: s.ko || '' } })
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white">
      {/* top bar */}
      <div className="relative flex h-12 shrink-0 items-center justify-between bg-white px-5 pt-4">
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
          <button
            type="button"
            onClick={() => onSave?.({ mode, body, data })}
            className="px-1 py-0.5"
          >
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

      <div className="relative min-h-0 flex-1">
      {/* EDIT */}
      {step === 'edit' && (
        <>
          <div className="no-scrollbar absolute inset-0 overflow-y-auto bg-white">
            <div className="px-5 pt-4">
              {/* 작성 주제 — 실선 테두리 카드, 문구는 원래대로 왼쪽 정렬, 새로고침/X 유지 */}
              {topicOn && (
                <div
                  className="mb-3.5 flex items-center gap-2 rounded-[20px] bg-white px-4 py-3"
                  style={{ outline: '1px solid #abcfff', outlineOffset: '-1px' }}
                >
                  <span
                    className="flex-1 font-sans text-[15px] font-medium"
                    style={{ color: '#0066ff', lineHeight: '22px', letterSpacing: '-.2px' }}
                  >
                    {topic.q}
                  </span>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={shuffleTopic}
                      aria-label="다른 주제"
                      className="tab-item flex h-7 w-7 items-center justify-center rounded-full outline-none active:bg-[#e8f0ff]"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M15.5 5.5A6.5 6.5 0 1 0 16.9 12"
                          stroke="#0066ff"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                        <path d="M16.5 3.2V6.2H13.5" stroke="#0066ff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTopicOn(false)}
                      aria-label="주제 닫기"
                      className="tab-item flex h-7 w-7 items-center justify-center rounded-full outline-none active:bg-[#e8f0ff]"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 2l10 10M12 2L2 12" stroke="#0066ff" strokeWidth="1.7" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              <textarea
                value={body}
                onChange={onBodyChange}
                placeholder={isEn ? 'Write freely.' : '자유롭게 작성해주세요'}
                autoFocus
                className="min-h-[480px] w-full resize-none border-none bg-transparent font-inter text-[16px] text-ink outline-none placeholder:text-[#BFBFBF]"
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[18px] bg-white">
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
        <div className="no-scrollbar absolute inset-0 overflow-y-auto bg-white">
          <div className="px-5 pb-16 pt-4">
            <SentenceResult
              data={data}
              mode={dm}
              onModeChange={setDm}
              showToggle={!isEn}
              hint={isEn ? 'correction' : 'word'}
              activeWord={activeWord}
              activeFix={activeFix}
              onTapWord={onTapWord}
              onTapFix={onTapFix}
              listen={listen}
              loading={loading}
              onListen={toggleListen}
              bookmark={bookmark}
              onBookmark={toggleBookmark}
              playing={playing}
              loadingAll={loadingAll}
              onTogglePlay={togglePlay}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
