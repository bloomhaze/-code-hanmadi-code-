import { ListenIcon, BookmarkIcon } from './icons.jsx'
import { mkWords } from '../lib/text.js'

const ACCENT = '#0066FF'

function HandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M18.1069 10.8514C17.7692 10.6909 17.3966 10.6177 17.0232 10.6385C17.0648 10.3217 17.0382 9.99963 16.9452 9.6939C16.8523 9.38817 16.6951 9.1058 16.4843 8.86567C16.2735 8.62554 16.0139 8.43318 15.7227 8.30144C15.4316 8.16971 15.1157 8.10164 14.7962 8.10178L15.8506 5.87746C16.1057 5.33941 16.1365 4.72208 15.9364 4.16127C15.7363 3.60047 15.3216 3.14212 14.7836 2.88706C14.2456 2.632 13.6282 2.60113 13.0674 2.80123C12.5066 3.00133 12.0483 3.41601 11.7932 3.95406L9.04549 9.75034L8.97926 9.175C8.9547 8.88107 8.87248 8.59485 8.73731 8.33269C8.60214 8.07053 8.41665 7.83756 8.19144 7.64708C7.73661 7.2624 7.1476 7.07415 6.55397 7.12375C5.96034 7.17335 5.41074 7.45673 5.02605 7.91156C4.64137 8.36639 4.45312 8.95541 4.50272 9.54904L4.55841 10.3057C4.96808 15.8826 5.13738 18.191 8.53908 19.8036C10.2304 20.603 12.1697 20.6989 13.9317 20.0702C15.6936 19.4415 17.1342 18.1397 17.9375 16.4502L19.1739 13.8418C19.429 13.3038 19.4599 12.6864 19.2598 12.1256C19.0597 11.5648 18.645 11.1065 18.1069 10.8514ZM16.7782 15.9006C16.121 17.283 14.9424 18.3482 13.5008 18.8625C12.0592 19.3769 10.4724 19.2984 9.08862 18.6443C6.36219 17.3519 6.24068 15.697 5.83864 10.2107L5.78288 9.45044L5.78459 9.44682C5.76378 9.19264 5.84473 8.9406 6.00966 8.74607C6.17459 8.55154 6.40999 8.43045 6.66415 8.4094C6.83249 8.39551 7.00148 8.42662 7.15383 8.49955C7.30677 8.57178 7.43797 8.68305 7.53421 8.82214C7.63045 8.96123 7.68832 9.12324 7.70199 9.29182C7.70219 9.29903 7.70294 9.3062 7.70424 9.31329L8.02655 12.1281C8.04278 12.2664 8.10354 12.3956 8.19965 12.4963C8.29576 12.597 8.42201 12.6636 8.55935 12.6863C8.69669 12.7089 8.83766 12.6862 8.96099 12.6217C9.08432 12.5572 9.18332 12.4543 9.24304 12.3286L12.9525 4.5036C13.0618 4.27301 13.2582 4.09529 13.4985 4.00953C13.7389 3.92377 14.0035 3.937 14.2341 4.04632C14.4646 4.15563 14.6424 4.35206 14.7281 4.59241C14.8139 4.83275 14.8007 5.09732 14.6913 5.32791L12.3558 10.2548C12.2829 10.4085 12.2741 10.5849 12.3313 10.7451C12.3884 10.9053 12.5069 11.0363 12.6606 11.1092C12.8144 11.182 12.9907 11.1909 13.151 11.1337C13.3112 11.0765 13.4422 10.958 13.515 10.8043L13.9272 9.93486C14.0365 9.70427 14.2329 9.52654 14.4733 9.44078C14.7136 9.35503 14.9782 9.36826 15.2088 9.47757C15.4394 9.58688 15.6171 9.78332 15.7029 10.0237C15.7886 10.264 15.7754 10.5286 15.6661 10.7592L14.9792 12.2082C14.9063 12.362 14.8975 12.5383 14.9546 12.6986C15.0118 12.8588 15.1303 12.9898 15.284 13.0626C15.4377 13.1355 15.6141 13.1443 15.7744 13.0872C15.9346 13.03 16.0655 12.9115 16.1384 12.7578L16.2758 12.468C16.3851 12.2374 16.5815 12.0597 16.8219 11.9739C17.0622 11.8881 17.3268 11.9014 17.5574 12.0107C17.788 12.12 17.9657 12.3164 18.0515 12.5568C18.1372 12.7971 18.124 13.0617 18.0147 13.2923L16.7782 15.9006Z"
        fill="#9B9B9B"
      />
    </svg>
  )
}

function PlayPause({ playing }) {
  return playing ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3.5" y="3" width="3" height="10" rx="1" fill="#fff" />
      <rect x="9.5" y="3" width="3" height="10" rx="1" fill="#fff" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M3.33374 7.49984C2.64338 7.49984 2.08374 8.05948 2.08374 8.74984V11.2498C2.08374 11.9402 2.64338 12.4998 3.33374 12.4998H5.41707L8.50822 15.7146C8.89826 16.1203 9.58374 15.8442 9.58374 15.2814V4.71824C9.58374 4.1555 8.89826 3.8794 8.50822 4.28505L5.41707 7.49984H3.33374Z"
        fill="#121212"
      />
      <path
        d="M11.6663 7.0835C12.4297 7.86237 12.8573 8.90953 12.8573 10.0002C12.8573 11.0908 12.4297 12.138 11.6663 12.9168"
        stroke="#121212"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14.1663 5C14.8756 5.62561 15.4438 6.39501 15.8329 7.25708C16.2221 8.11915 16.4233 9.05416 16.4233 10C16.4233 10.9458 16.2221 11.8808 15.8329 12.7429C15.4438 13.605 14.8756 14.3744 14.1663 15"
        stroke="#121212"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

// Renders 한 문장씩 / 전체 보기 for a diary result — shared by the detail
// view and the write-flow result.
export default function SentenceResult({
  data,
  mode,
  onModeChange,
  showToggle,
  hint = 'word', // 'word' | 'correction'
  activeWord,
  activeFix,
  onTapWord,
  onTapFix,
  listen = {},
  onListen,
  bookmark = {},
  onBookmark,
  playing,
  onTogglePlay,
}) {
  const showSentence = hint === 'correction' ? true : mode === 'sentence'
  const showAll = hint !== 'correction' && mode === 'all'
  const segX = mode === 'sentence' ? '0%' : '100%'

  return (
    <div className="flex flex-col">
      {/* segmented toggle */}
      {showToggle && (
        <div
          className="relative mb-5 mt-1.5 box-border flex h-9 self-center rounded-full bg-[#f1f1f2] p-[3px]"
          style={{ width: 155 }}
        >
          <div
            className="absolute rounded-full bg-white"
            style={{
              top: 3,
              left: 3,
              width: 'calc(50% - 3px)',
              height: 'calc(100% - 6px)',
              boxShadow: '0 2px 8px rgba(0,0,0,.08)',
              transition: 'transform .3s cubic-bezier(.34,1.15,.64,1)',
              transform: `translateX(${segX})`,
            }}
          />
          {[
            { m: 'sentence', label: '한 문장씩' },
            { m: 'all', label: '전체 보기' },
          ].map(({ m, label }) => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              className="relative z-[1] flex flex-1 items-center justify-center"
            >
              <span
                className="font-sans text-[13px] font-medium transition-colors"
                style={{ color: mode === m ? '#121212' : '#9b9b9b' }}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* hint */}
      <div className="mb-4 flex items-center justify-center gap-1">
        <HandIcon />
        {hint === 'correction' ? (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center rounded bg-[#dcebff] px-1.5 py-[3px]">
              <span className="font-inter text-[12px] font-medium leading-none text-[#0066ff]">파란 영역</span>
            </div>
            <span className="font-sans text-[13px] text-muted">클릭하고 교정 이유 확인</span>
          </div>
        ) : (
          <span className="font-sans text-[13px] text-muted">단어를 탭하면 뜻과 예문을 볼 수 있어요</span>
        )}
      </div>

      {/* SENTENCE MODE */}
      {showSentence && (
        <div className="flex flex-col gap-[9px]">
          {data.sentences.map((s, i) => {
            const ls = !!listen[i]
            const bm = !!bookmark[i]
            const isCorrection = !!s.correction
            const origFull = isCorrection ? s.enSegs.map((g) => g.t).join('') : ''
            const fixedFull = isCorrection ? s.fixSegs.map((g) => g.t).join('') : ''
            return (
              <div
                key={i}
                className="flex flex-col gap-1.5 rounded-[20px] bg-[#f7f7f7] p-5"
                style={{ boxShadow: 'inset 0 0 0 .5px #eee' }}
              >
                <span className="mb-1.5 font-sans text-[14px] font-light leading-5 text-sub">{s.ko}</span>

                {isCorrection && s.perfect ? (
                  /* 완벽하게 쓴 문장 — 교정 없이 문장만 표시 */
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-inter text-[16px] text-ink"
                      style={{ lineHeight: '28.8px' }}
                    >
                      {s.en}
                    </span>
                    <span
                      className="shrink-0 whitespace-nowrap rounded-full bg-[#eafaf0] px-2 py-[3px] font-sans text-[11px] font-medium"
                      style={{ color: '#12b76a', letterSpacing: '-.2px' }}
                    >
                      완벽해요
                    </span>
                  </div>
                ) : isCorrection ? (
                  <>
                    {/* original — 바뀐(빨간) 부분은 취소선 표시(클릭 X) */}
                    <div className="font-inter text-[16px] text-ink" style={{ lineHeight: '28.8px' }}>
                      {s.enSegs.map((g, gi) =>
                        g.kind === 'w' ? (
                          <span
                            key={gi}
                            style={{
                              background: '#ffe1e1',
                              color: '#ff4242',
                              borderRadius: 6,
                              padding: '1px 3px',
                              textDecoration: 'line-through',
                              textDecorationColor: '#ff7a7a',
                            }}
                          >
                            {g.t}
                          </span>
                        ) : (
                          <span key={gi}>{g.t}</span>
                        ),
                      )}
                    </div>
                    <div className="my-3 mb-3 mt-4 h-px bg-[#e6e6e6]" />
                    <span
                      className="font-inter text-[13px] font-semibold"
                      style={{ color: ACCENT, letterSpacing: '-.1px' }}
                    >
                      교정
                    </span>
                    {/* corrected — 고쳐진(파란) 부분을 클릭하면 교정 이유 설명 */}
                    <div className="mt-2 font-inter text-[16px] text-ink" style={{ lineHeight: '28.8px' }}>
                      {s.fixSegs.map((g, gi) => {
                        const fid = `${i}-${gi}`
                        return g.kind === 'f' ? (
                          <span
                            key={gi}
                            className={activeFix === fid ? 'fix-active' : undefined}
                            onClick={() => onTapFix?.(fid, g.t, origFull, fixedFull)}
                            style={{
                              background: '#dcebff',
                              color: '#0066ff',
                              borderRadius: 5,
                              padding: '1px 3px',
                              fontWeight: 500,
                              cursor: 'pointer',
                            }}
                          >
                            {g.t}
                          </span>
                        ) : (
                          <span key={gi}>{g.t}</span>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <span className="font-inter text-[16px] font-normal text-ink-2" style={{ lineHeight: '26px', letterSpacing: '-.2px' }}>
                    {mkWords(s.en).map((w, wi) => {
                      const wid = `${i}-${wi}`
                      return (
                        <span key={wi}>
                          <span
                            onClick={() => w.term && onTapWord?.(wid, w.term, s.en)}
                            style={{
                              cursor: 'pointer',
                              borderRadius: 6,
                              padding: '1px 3px',
                              margin: '0 -1px',
                              fontWeight: 400,
                              background: activeWord === wid ? '#ededed' : 'transparent',
                              transition: 'background .15s ease',
                            }}
                          >
                            {w.t}
                          </span>{' '}
                        </span>
                      )
                    })}
                  </span>
                )}

                <div className="mt-1 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onListen?.(i, isCorrection ? fixedFull : s.en)}
                    className="h-8 w-8"
                  >
                    <ListenIcon on={ls} />
                  </button>
                  <button type="button" onClick={() => onBookmark?.(i)} className="h-8 w-8">
                    <BookmarkIcon on={bm} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ALL MODE */}
      {showAll && (
        <div
          className="flex flex-col gap-4 rounded-[20px] bg-[#f7f7f7] p-5"
          style={{ boxShadow: 'inset 0 0 0 .5px #eee' }}
        >
          <span className="font-sans text-[14px] font-light text-sub" style={{ lineHeight: '24px' }}>
            {data.allKo}
          </span>
          <span className="font-inter text-[16px] text-ink" style={{ lineHeight: '28px', letterSpacing: '-.2px' }}>
            {data.allEn}
          </span>
          <div className="flex justify-end border-t border-[#e4e4e4] pt-3.5">
            <button
              type="button"
              onClick={onTogglePlay}
              className="box-border flex h-[38px] w-28 items-center justify-center gap-[7px] rounded-full"
              style={{ background: playing ? ACCENT : '#eee' }}
            >
              <PlayPause playing={playing} />
              <span
                className="font-sans text-[14px] font-medium"
                style={{ color: playing ? '#fff' : '#121212' }}
              >
                {playing ? '멈추기' : '전체 듣기'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
