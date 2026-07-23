// iOS-style status bar (9:41, signal, wifi, battery) matching the 시안.
export default function StatusBar() {
  return (
    <div className="absolute left-0 top-0 z-30 flex h-12 w-full items-center justify-between pl-[34px] pr-[26px]">
      <span
        className="font-inter text-[15px] font-semibold text-ink"
        style={{ letterSpacing: '-.2px' }}
      >
        9:41
      </span>
      <div className="flex items-center gap-1.5">
        <svg width="18" height="11" viewBox="0 0 18 11" fill="#1c1c1e">
          <rect x="0" y="6" width="3" height="5" rx="1" />
          <rect x="5" y="4" width="3" height="7" rx="1" />
          <rect x="10" y="2" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="#1c1c1e">
          <path d="M8 2.2c2 0 3.9.8 5.3 2.1l1.2-1.3C13 1.2 10.6.3 8 .3S3 1.2 1.5 3l1.2 1.3C4.1 3 6 2.2 8 2.2Zm0 3.3c1.1 0 2.1.4 2.9 1.2l1.2-1.3C11 4.1 9.6 3.5 8 3.5s-3 .6-4.1 1.9l1.2 1.3c.8-.8 1.8-1.2 2.9-1.2ZM8 8l1.5-1.6C9.1 6 8.6 5.8 8 5.8s-1.1.2-1.5.6L8 8Z" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="1" y="1" width="20" height="10" rx="3" stroke="#1c1c1e" strokeOpacity=".35" />
          <rect x="2.5" y="2.5" width="17" height="7" rx="1.5" fill="#1c1c1e" />
          <rect x="22.5" y="4" width="1.5" height="4" rx="1" fill="#1c1c1e" fillOpacity=".4" />
        </svg>
      </div>
    </div>
  )
}
