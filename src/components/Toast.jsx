import { useEffect } from 'react'

// Frosted dark toast that drops in from the top, matching the 시안.
export default function Toast({ message, onDone, duration = 1800 }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDone, duration)
    return () => clearTimeout(t)
  }, [message, onDone, duration])

  if (!message) return null

  return (
    <div
      className="absolute left-4 right-4 top-[60px] z-50 flex min-h-[50px] items-center gap-2.5 rounded-2xl px-4 py-3"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 0 24px 0 rgba(0,0,0,.22)',
        background: 'rgba(28,28,30,.6)',
        animation: 'promptFade .34s ease',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.99967 18.3333C5.3973 18.3333 1.66634 14.6023 1.66634 9.99992C1.66634 5.39754 5.3973 1.66658 9.99968 1.66659C14.602 1.66659 18.333 5.39755 18.333 9.99992C18.333 14.6023 14.602 18.3333 9.99967 18.3333ZM9.99968 7.08325C10.4599 7.08325 10.833 6.71016 10.833 6.24992C10.833 5.81852 10.5052 5.46343 10.0851 5.42065L9.99968 5.41659C9.56828 5.41659 9.21319 5.74436 9.17041 6.16447L9.16634 6.24992C9.16634 6.68131 9.49412 7.03641 9.91423 7.07918L9.99968 7.08325ZM10.75 14.1666L10.75 8.33325L9.25016 8.33325L9.25016 14.1666L10.75 14.1666Z"
          fill="white"
        />
      </svg>
      <span
        className="font-sans text-[14px] text-white"
        style={{ letterSpacing: '-.2px', textAlign: 'left' }}
      >
        {message}
      </span>
    </div>
  )
}
