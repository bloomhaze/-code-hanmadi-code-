// 교정 사유 ("왜 이렇게 고치나요?").
//  - 데스크탑/태블릿(≥1024px): 본문 오른쪽에 붙는 사이드 패널
//  - 모바일(<1024px): 하단 바텀시트
// 열림/닫힘·내용 교체는 App(tapFix)에서 관리한다.
export default function FixPopup({ state, onClose }) {
  if (!state?.open) return null
  const { loading, reason } = state

  const Inner = (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-[3px]">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path
            d="M10.2533 3.20085C10.813 2.64119 11.7209 2.6412 12.2806 3.20085L12.8665 3.78678C13.4262 4.34652 13.4262 5.2544 12.8665 5.81413L5.61393 13.0667C5.0542 13.6264 4.14632 13.6264 3.58659 13.0667L3.00065 12.4808C2.441 11.9211 2.441 11.0132 3.00065 10.4535L10.2533 3.20085ZM11.5 12.8005V11.9007H10.6003C10.3609 11.9007 10.1667 11.7064 10.1667 11.4671C10.1667 11.2278 10.3609 11.0335 10.6003 11.0335H11.5V10.1338C11.5 9.89447 11.6943 9.7002 11.9336 9.7002C12.1729 9.7002 12.3672 9.89447 12.3672 10.1338V11.0335H13.2669C13.5063 11.0335 13.7005 11.2278 13.7005 11.4671C13.7005 11.7064 13.5063 11.9007 13.2669 11.9007H12.3672V12.8005C12.3672 13.0398 12.1729 13.2341 11.9336 13.2341C11.6943 13.2341 11.5 13.0398 11.5 12.8005ZM3.61393 11.0667C3.39274 11.288 3.39274 11.6462 3.61393 11.8675L4.19987 12.4535C4.42115 12.6746 4.77937 12.6746 5.00065 12.4535L9.98698 7.46712L8.60026 6.0804L3.61393 11.0667ZM2.16667 7.46712V7.23405H1.93359C1.69427 7.23405 1.5 7.03978 1.5 6.80046C1.5 6.56113 1.69427 6.36686 1.93359 6.36686H2.16667V6.13379C2.16667 5.89447 2.36094 5.7002 2.60026 5.7002C2.83958 5.7002 3.03385 5.89447 3.03385 6.13379V6.36686H3.26693C3.50625 6.36686 3.70052 6.56113 3.70052 6.80046C3.70052 7.03978 3.50625 7.23405 3.26693 7.23405H3.03385V7.46712C3.03385 7.70645 2.83958 7.90072 2.60026 7.90072C2.36094 7.90072 2.16667 7.70645 2.16667 7.46712ZM11.6673 3.81413C11.446 3.59293 11.0878 3.59293 10.8665 3.81413L9.21354 5.46712L10.6003 6.85384L12.2533 5.20085C12.4745 4.97957 12.4745 4.62134 12.2533 4.40007L11.6673 3.81413ZM4.83333 4.13379V3.56738H4.26693C4.0276 3.56738 3.83333 3.37311 3.83333 3.13379C3.83333 2.89447 4.0276 2.7002 4.26693 2.7002H4.83333V2.13379C4.83333 1.89447 5.0276 1.7002 5.26693 1.7002C5.50625 1.7002 5.70052 1.89447 5.70052 2.13379V2.7002H6.26693C6.50625 2.7002 6.70052 2.89447 6.70052 3.13379C6.70052 3.37311 6.50625 3.56738 6.26693 3.56738H5.70052V4.13379C5.70052 4.37311 5.50625 4.56738 5.26693 4.56738C5.0276 4.56738 4.83333 4.37311 4.83333 4.13379Z"
            fill="#0066FF"
            stroke="#0066FF"
            strokeWidth="0.3"
            strokeLinecap="round"
            strokeLinejoin="round"
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
  )

  return (
    <>
      {/* 모바일 — 하단 바텀시트 */}
      <div
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/35 lg:hidden"
        onClick={onClose}
      >
        <div
          className="w-full max-w-[500px] rounded-t-[22px] bg-white p-2.5 pb-6"
          style={{ animation: 'sheetUp .28s cubic-bezier(.22,1,.36,1)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="rounded-2xl bg-[#f7f7f8] px-[18px] py-4">{Inner}</div>
        </div>
      </div>

      {/* 데스크탑/태블릿 — 우측 사이드 패널 */}
      <div
        className="fixed z-[60] hidden lg:block"
        style={{
          top: 157,
          left: 'calc(50% + 40px)',
          width: 400,
          animation: 'fixPanelIn .28s cubic-bezier(.22,1,.36,1)',
        }}
      >
        <div className="rounded-[20px] border border-[#0066ff] bg-white px-5 py-[18px]">{Inner}</div>
      </div>
    </>
  )
}
