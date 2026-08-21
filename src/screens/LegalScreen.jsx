import { LEGAL_DOCS, LEGAL_UPDATED } from '../data/legal.js'

// 이용약관 / 개인정보처리방침 — 전체화면 오버레이(스크롤). kind: 'terms' | 'privacy'
export default function LegalScreen({ kind = 'terms', onBack }) {
  const doc = LEGAL_DOCS[kind] || LEGAL_DOCS.terms

  return (
    <div className="absolute inset-0 z-[55] flex flex-col bg-white">
      {/* top bar */}
      <div className="flex h-12 shrink-0 items-center px-3 pt-4">
        <button type="button" onClick={onBack} className="flex h-11 w-11 items-center justify-center" aria-label="뒤로">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="#121212" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* content */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-16">
        <h1 className="mt-2 font-sans text-[22px] font-bold text-ink" style={{ letterSpacing: '-.4px' }}>
          {doc.title}
        </h1>
        <p className="mt-2 font-sans text-[12px] font-light text-muted-2">최종 업데이트: {LEGAL_UPDATED}</p>

        {doc.intro && (
          <p className="mt-4 font-sans text-[14px] font-normal text-sub" style={{ lineHeight: '22px', letterSpacing: '-.2px' }}>
            {doc.intro}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-6">
          {doc.sections.map((sec) => (
            <section key={sec.h}>
              <h2 className="font-sans text-[15px] font-semibold text-ink" style={{ letterSpacing: '-.3px' }}>
                {sec.h}
              </h2>
              <div className="mt-2 flex flex-col gap-1.5">
                {sec.body.map((line, i) =>
                  line.startsWith('- ') ? (
                    <div key={i} className="flex gap-1.5">
                      <span className="mt-[9px] h-[3px] w-[3px] shrink-0 rounded-full bg-muted" />
                      <span
                        className="font-sans text-[14px] font-light text-sub"
                        style={{ lineHeight: '22px', letterSpacing: '-.2px' }}
                      >
                        {line.slice(2)}
                      </span>
                    </div>
                  ) : (
                    <p
                      key={i}
                      className="font-sans text-[14px] font-light text-sub"
                      style={{ lineHeight: '22px', letterSpacing: '-.2px' }}
                    >
                      {line}
                    </p>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-8 font-sans text-[12px] font-light text-muted-2" style={{ lineHeight: '18px' }}>
          본 문서는 참고용 초안이며, 실제 법적 효력을 위해서는 전문가 검토가 필요할 수 있어요.
        </p>
      </div>
    </div>
  )
}
