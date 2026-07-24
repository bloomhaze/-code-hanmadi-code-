// 일기 삭제 확인 다이얼로그.
export default function DeleteDialog({ onConfirm, onClose }) {
  return (
    <div className="absolute inset-0 z-[51] flex items-center justify-center bg-black/35 px-6" onClick={onClose}>
      <div
        className="flex w-full flex-col items-center rounded-[20px] bg-white px-4 pb-4 pt-6"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="mb-2 font-sans text-[18px] font-medium text-ink">일기를 삭제하시겠어요?</span>
        <span className="mb-5 text-center font-sans text-[14px] font-light text-muted" style={{ lineHeight: '20px' }}>
          이 일기에서 저장한 표현·문장도
          <br />
          함께 삭제되며 다시 되돌릴 수 없어요
        </span>
        <button
          type="button"
          onClick={onConfirm}
          className="mb-2 w-full rounded-2xl bg-[#ff4242] py-[15px] text-center"
        >
          <span className="font-sans text-[16px] font-medium text-white">삭제</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-12 w-full rounded-2xl bg-white text-center"
          style={{ boxShadow: 'inset 0 0 0 1px #ededed' }}
        >
          <span className="font-sans text-[16px] font-medium text-ink">취소</span>
        </button>
      </div>
    </div>
  )
}
