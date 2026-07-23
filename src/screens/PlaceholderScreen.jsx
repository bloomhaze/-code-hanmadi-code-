// Simple on-brand placeholder used for the 일기 / 단어장 / 마이 tabs until each
// screen is built out. Keeps the shell navigable from the tab bar.
export default function PlaceholderScreen({ title, message = '곧 만나요' }) {
  return (
    <>
      <div className="absolute left-0 top-12 z-20 flex h-12 w-full items-center bg-white px-5">
        <span
          className="font-sans text-[20px] font-semibold text-ink"
          style={{ letterSpacing: '-.4px' }}
        >
          {title}
        </span>
      </div>
      <div className="no-scrollbar absolute left-0 top-24 h-[600px] w-full overflow-y-auto bg-white">
        <div className="flex h-full flex-col items-center justify-center gap-1.5 px-5">
          <span className="font-sans text-[16px] font-medium text-ink">{title}</span>
          <span className="font-sans text-[13px] font-light text-muted-2">{message}</span>
        </div>
      </div>
    </>
  )
}
