// 확인 다이얼로그 (kind: 'logout' | 'withdraw' | 'leaveWrite').
const COPY = {
  logout: {
    title: '로그아웃 할까요?',
    desc: '로그아웃 후에도 작성한 일기는\n그대로 유지돼요',
  },
  withdraw: {
    title: '정말 탈퇴하시겠어요?',
    desc: '탈퇴 후엔 모든 일기와 계정 정보가\n영구적으로 삭제되며 복구할 수 없어요',
  },
  // 저장 안 하고 작성 화면을 나가려 할 때.
  leaveWrite: {
    title: '저장하지 않고 나갈까요?',
    desc: '지금까지 작성한 내용이 사라져요.\n저장하지 않으면 다시 불러올 수 없어요',
    yes: '나가기',
    no: '계속 작성',
  },
}

export default function ConfirmDialog({ kind = 'logout', onYes, onClose }) {
  const { title, desc, yes = '네', no = '아니요' } = COPY[kind] || COPY.logout

  return (
    <div className="fixed inset-0 z-[56] flex items-center justify-center bg-black/35 px-10" onClick={onClose}>
      <div
        className="flex w-full max-w-[320px] flex-col items-center rounded-3xl bg-white px-5 pb-5 pt-7"
        style={{ animation: 'scaleIn .24s cubic-bezier(.22,1,.36,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="mb-2.5 text-center font-sans text-[18px] font-medium text-ink" style={{ letterSpacing: '-.3px' }}>
          {title}
        </span>
        <span
          className="mb-[22px] whitespace-pre-line text-center font-sans text-[14px] font-light text-muted"
          style={{ lineHeight: '21px', letterSpacing: '-.2px' }}
        >
          {desc}
        </span>
        <div className="flex w-full gap-2.5">
          <button
            type="button"
            onClick={onYes}
            className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-white"
            style={{ boxShadow: 'inset 0 0 0 1px #ededed' }}
          >
            <span className="font-sans text-[14px] font-medium text-ink" style={{ letterSpacing: '-.3px' }}>
              {yes}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-ink"
          >
            <span className="font-sans text-[14px] font-medium text-white" style={{ letterSpacing: '-.3px' }}>
              {no}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
