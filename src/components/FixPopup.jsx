// Bottom-sheet explaining why a correction was made (교정 사유 팝업).
export default function FixPopup({ state, onClose }) {
  if (!state?.open) return null
  const { loading, reason } = state

  return (
    <>
      <div className="absolute inset-0 z-[60] bg-black/35" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 z-[61] rounded-t-[22px] bg-white px-5 pb-[34px] pt-2.5"
        style={{ animation: 'sheetUp .3s cubic-bezier(.22,1,.36,1)' }}
      >
        <div className="mx-auto mb-[18px] h-1 w-9 rounded-full bg-[#dcdcdc]" />
        <div className="flex flex-col gap-2.5 rounded-2xl bg-[#f7f7f8] px-[18px] py-4">
          <div className="flex items-center gap-[3px]">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path
                d="M10.2533 3.20085C10.813 2.64119 11.7209 2.6412 12.2806 3.20085L12.8665 3.78678C13.4262 4.34652 13.4262 5.2544 12.8665 5.81413L5.61393 13.0667C5.0542 13.6264 4.14632 13.6264 3.58659 13.0667L3.00065 12.4808C2.441 11.9211 2.441 11.0132 3.00065 10.4535L10.2533 3.20085Z"
                fill="#0066FF"
                stroke="#0066FF"
                strokeWidth="0.3"
              />
            </svg>
            <span
              className="font-sans text-[13px] font-medium text-accent"
              style={{ lineHeight: '100%', letterSpacing: '.5px' }}
            >
              왜 이렇게 고치나요?
            </span>
          </div>
          {loading ? (
            <div className="flex items-center gap-2.5 py-0.5">
              <div
                className="h-[18px] w-[18px] rounded-full border-[2.5px] border-[#e6e6e6]"
                style={{ borderTopColor: '#0066ff', animation: 'spin .8s linear infinite' }}
              />
              <span className="font-sans text-[14px] font-medium text-muted">교정 이유를 찾고 있어요</span>
            </div>
          ) : (
            <span
              className="font-sans text-[15px] text-ink"
              style={{ lineHeight: '25.5px', letterSpacing: '-.2px' }}
            >
              {reason}
            </span>
          )}
        </div>
      </div>
    </>
  )
}
