import { useEffect } from 'react'

// Frosted dark toast. Matches the 시안 logic:
// - undo action present  → show "되돌리기", no icon
// - check flag           → show a check icon
// - otherwise            → show the info (ⓘ) icon
export default function Toast({ toast, onClose }) {
  const message = toast?.message

  useEffect(() => {
    if (!message) return
    const t = setTimeout(onClose, toast.undo ? 3200 : 1800)
    return () => clearTimeout(t)
  }, [message, toast, onClose])

  if (!message) return null

  const showInfo = !toast.undo && !toast.check

  return (
    <div
      className="absolute left-4 right-4 top-2 z-50 flex min-h-[50px] items-center gap-2.5 rounded-2xl px-4 py-3"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 0 24px 0 rgba(0,0,0,.22)',
        background: 'rgba(28,28,30,.6)',
        animation: 'toastDown .34s cubic-bezier(.22,1,.36,1)',
      }}
    >
      {toast.check && (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="10" cy="10" r="10" fill="#fff" />
          <path d="M6 10.2l2.6 2.6L14.2 7" stroke="#3a3a3c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {showInfo && (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.99967 18.3333C5.3973 18.3333 1.66634 14.6023 1.66634 9.99992C1.66634 5.39754 5.3973 1.66658 9.99968 1.66659C14.602 1.66659 18.333 5.39755 18.333 9.99992C18.333 14.6023 14.602 18.3333 9.99967 18.3333ZM9.99968 7.08325C10.4599 7.08325 10.833 6.71016 10.833 6.24992C10.833 5.81852 10.5052 5.46343 10.0851 5.42065L9.99968 5.41659C9.56828 5.41659 9.21319 5.74436 9.17041 6.16447L9.16634 6.24992C9.16634 6.68131 9.49412 7.03641 9.91423 7.07918L9.99968 7.08325ZM10.75 14.1666L10.75 8.33325L9.25016 8.33325L9.25016 14.1666L10.75 14.1666Z"
            fill="white"
          />
        </svg>
      )}
      <span className="font-sans text-[14px] text-white" style={{ letterSpacing: '-.2px', textAlign: 'left' }}>
        {message}
      </span>
      {toast.undo && (
        <button
          type="button"
          onClick={() => {
            toast.undo()
            onClose()
          }}
          className="ml-auto flex-shrink-0 pl-3 font-sans text-[14px] font-semibold"
          style={{ color: '#4d9bff', letterSpacing: '-.2px' }}
        >
          되돌리기
        </button>
      )}
    </div>
  )
}
