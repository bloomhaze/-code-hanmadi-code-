// Bottom sheet to pick how to write a diary: 한글로 작성 / 영어로 도전.
export default function WriteMethodSheet({ onChoose, onClose, enLocked = false }) {
  const Chevron = ({ color = '#c4c4c4' }) => (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" style={{ flexShrink: 0 }}>
      <path d="M1 1l6 6-6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  return (
    <div
      className="fixed inset-0 z-[54] flex items-end justify-center bg-black/35 sm:items-center sm:px-5"
      onClick={onClose}
    >
      <div
        className="modal-pop w-full max-w-[500px] rounded-t-[24px] bg-white px-4 pb-8 pt-5 sm:max-w-[440px] sm:rounded-3xl sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => onChoose('ko')}
            className="flex h-[90px] items-center gap-3 rounded-[20px] bg-[#f7f7f7] px-[18px] py-4 text-left active:bg-[#ececec]"
          >
            <div className="flex flex-1 flex-col gap-[7px]">
              <span className="font-sans text-[16px] font-semibold text-ink" style={{ letterSpacing: '-.3px' }}>
                한글로 작성
              </span>
              <span className="font-sans text-[13px] font-light text-muted" style={{ lineHeight: '16px' }}>
                한글로 편하게 적고, 번역을 통해 몰랐던
                <br />
                영어 표현을 익히기
              </span>
            </div>
            <Chevron />
          </button>

          <button
            type="button"
            onClick={() => onChoose('en')}
            className="flex h-[90px] items-center gap-3 rounded-[20px] bg-[#f7f7f7] px-[18px] py-4 text-left active:bg-[#ececec]"
          >
            <div className="flex flex-1 flex-col gap-[7px]">
              <div className="flex items-center gap-1.5">
                <span className="font-sans text-[16px] font-semibold text-ink" style={{ letterSpacing: '-.3px' }}>
                  영어로 도전
                </span>
                {enLocked && (
                  <div className="flex h-[19px] items-center gap-[3px] rounded-full bg-ink pl-1.5 pr-2">
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
                      <rect x="3.9" y="7.9" width="11.6" height="10.1" rx="1.4" fill="#fff" />
                      <path
                        d="M9.7 2.3C11.5 2.3 13 3.8 13 5.6V7.5C13 9.1 11.8 10.3 10.2 10.3H9.2C7.7 10.3 6.4 9.1 6.4 7.5V5.6C6.4 3.8 7.9 2.3 9.7 2.3Z"
                        stroke="#fff"
                        strokeWidth="1.6"
                      />
                    </svg>
                    <span className="font-sans text-[11px] font-medium text-white" style={{ letterSpacing: '-.2px' }}>
                      프리미엄
                    </span>
                  </div>
                )}
              </div>
              <span className="font-sans text-[13px] font-light text-muted" style={{ lineHeight: '16px' }}>
                틀려도 괜찮아요. 영어로 최대한 써보고
                <br />
                교정받으며 표현을 배우기
              </span>
            </div>
            <Chevron />
          </button>
        </div>
      </div>
    </div>
  )
}
