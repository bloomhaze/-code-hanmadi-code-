// 비회원이 일기를 저장하려 할 때 뜨는 로그인 유도 바텀시트.
// 애플 로그인은 아직 미지원 — 구글 로그인만 노출한다.
export default function SaveLoginSheet({ onGoogle, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[57] flex items-end justify-center bg-black/40 sm:items-center sm:px-5"
      onClick={onClose}
    >
      <div
        className="modal-pop w-full max-w-[500px] rounded-t-[24px] bg-white px-5 pb-8 pt-3 sm:max-w-[400px] sm:rounded-3xl sm:pb-6 sm:pt-6"
        style={{ paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom) + 24px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모바일 바텀시트 그랩 핸들 (데스크탑 중앙 카드에서는 숨김) */}
        <div className="mx-auto mb-5 h-[5px] w-10 rounded-full bg-[#e3e3e3] sm:hidden" />

        <div className="flex flex-col items-center gap-2.5 px-1 text-center">
          <span className="font-sans text-[20px] font-semibold text-ink" style={{ letterSpacing: '-.4px' }}>
            일기를 저장할까요?
          </span>
          <span
            className="font-sans text-[14px] font-light"
            style={{ color: '#9b9b9b', lineHeight: '21px', letterSpacing: '-.2px' }}
          >
            로그인을 해야 일기와 저장한 표현이 안전하게
            <br />
            보관되며, 복습 퀴즈도 풀 수 있어요
          </span>
        </div>

        <button
          type="button"
          onClick={onGoogle}
          className="mt-7 flex h-[50px] w-full items-center justify-center gap-2 rounded-[20px] bg-white"
          style={{ boxShadow: 'inset 0 0 0 1px #ececee' }}
        >
          <img src="/brand/google-logo.svg" width="20" height="20" alt="" />
          <span className="font-sans text-[15px] font-medium text-ink" style={{ letterSpacing: '-.2px' }}>
            Google로 로그인
          </span>
        </button>
      </div>
    </div>
  )
}
