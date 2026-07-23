// Inline SVG icons ported from the "한마디" 시안.

export function HomeIcon({ fill = '#c4c4c4', className = '' }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M10.7 2.50003C11.0623 2.19017 11.5233 2.0199 12 2.0199C12.4767 2.0199 12.9377 2.19017 13.3 2.50003L20.3 8.50003C20.517 8.6856 20.6917 8.91548 20.8125 9.17421C20.9332 9.43294 20.9972 9.71453 21 10V19C21 19.5305 20.7893 20.0392 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0392 3 19.5305 3 19V10C3.00285 9.71453 3.06679 9.43294 3.18753 9.17421C3.30828 8.91548 3.48301 8.6856 3.7 8.50003L10.7 2.50003Z"
        fill={fill}
      />
    </svg>
  )
}

export function DiaryIcon({ fill = '#c4c4c4', className = '' }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"
        fill={fill}
        stroke={fill}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function VocabIcon({ fill = '#c4c4c4', className = '' }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 6.5C12 5.44 11.58 4.42 10.83 3.67 10.08 2.92 9.06 2.5 8 2.5H3.5C3.1 2.5 2.72 2.66 2.44 2.94 2.16 3.22 2 3.6 2 4V17C2 17.4 2.16 17.78 2.44 18.06 2.72 18.34 3.1 18.5 3.5 18.5H8C9.06 18.5 10.08 18.92 10.83 19.67 11.58 20.42 12 21.44 12 22.5V6.5Z"
        fill={fill}
        stroke={fill}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 6.5C12 5.44 12.42 4.42 13.17 3.67 13.92 2.92 14.94 2.5 16 2.5H20.5C20.9 2.5 21.28 2.66 21.56 2.94 21.84 3.22 22 3.6 22 4V17C22 17.4 21.84 17.78 21.56 18.06 21.28 18.34 20.9 18.5 20.5 18.5H16C14.94 18.5 13.92 18.92 13.17 19.67 12.42 20.42 12 21.44 12 22.5V6.5Z"
        fill={fill}
        stroke={fill}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MyIcon({ fill = '#c4c4c4', className = '' }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
        fill={fill}
      />
      <path
        d="M4 20C4 17.8783 4.84285 15.8434 6.34315 14.3431C7.84344 12.8429 9.87827 12 12 12C14.1217 12 16.1566 12.8429 17.6569 14.3431C19.1571 15.8434 20 17.8783 20 20C20 20.2652 19.8946 20.5196 19.7071 20.7071C19.5196 20.8946 19.2652 21 19 21H5C4.73478 21 4.48043 20.8946 4.29289 20.7071C4.10536 20.5196 4 20.2652 4 20Z"
        fill={fill}
      />
    </svg>
  )
}

// Pencil / write
export function PencilIcon({ size = 26, fill = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M15.75 7.58337L20.4167 12.25L9.33333 23.3334L4.08333 24.5L5.25 19.25L15.75 7.58337Z" fill={fill} />
      <path
        d="M17.5 5.83338L19.3667 3.96671C19.7161 3.62117 20.1877 3.42737 20.6792 3.42737C21.1706 3.42737 21.6422 3.62117 21.9917 3.96671L24.0333 6.00838C24.3789 6.35782 24.5727 6.82944 24.5727 7.32088C24.5727 7.81232 24.3789 8.28394 24.0333 8.63338L22.1667 10.5L17.5 5.83338Z"
        fill={fill}
      />
    </svg>
  )
}

// Speaker (listen). variant: 'on' filled accent, 'off' grey.
export function ListenIcon({ on = false }) {
  const bg = on ? '#0066FF' : '#EEEEEE'
  const ink = on ? 'white' : '#121212'
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="16" fill={bg} />
      <path
        d="M9.33374 13.4998C8.64338 13.4998 8.08374 14.0595 8.08374 14.7498V17.2498C8.08374 17.9402 8.64338 18.4998 9.33374 18.4998H11.4171L14.5082 21.7146C14.8983 22.1203 15.5837 21.8442 15.5837 21.2813V10.7188C15.5837 10.1559 14.8983 9.87975 14.5082 10.2855L11.4171 13.4998H9.33374Z"
        fill={ink}
      />
      <path
        d="M17.6663 13.0835C18.4297 13.8624 18.8573 14.9095 18.8573 16.0002C18.8573 17.0908 18.4297 18.138 17.6663 18.9168"
        stroke={ink}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M20.1663 11C20.8756 11.6256 21.4438 12.395 21.8329 13.2571C22.2221 14.1192 22.4233 15.0542 22.4233 16C22.4233 16.9458 22.2221 17.8808 21.8329 18.7429C21.4438 19.605 20.8756 20.3744 20.1663 21"
        stroke={ink}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

// Bookmark. on = filled accent, off = outline.
export function BookmarkIcon({ on = false }) {
  const bg = on ? '#0066FF' : '#EEEEEE'
  const fill = on ? 'white' : 'none'
  const stroke = on ? 'white' : '#121212'
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="16" fill={bg} />
      <path
        d="M12 10.6504H20C20.1933 10.6504 20.3496 10.8067 20.3496 11V21.0791C20.3496 21.3623 20.0308 21.5286 19.7988 21.3662L16.9463 19.3691C16.3782 18.9715 15.6218 18.9715 15.0537 19.3691L12.2012 21.3662C11.9692 21.5286 11.6504 21.3623 11.6504 21.0791V11C11.6504 10.8067 11.8067 10.6504 12 10.6504Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChevronLeft({ color = '#121212' }) {
  return (
    <svg width="9" height="16" viewBox="0 0 9 16" fill="none">
      <path d="M7.5 1 1 8l6.5 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronRight({ color = '#121212' }) {
  return (
    <svg width="9" height="16" viewBox="0 0 9 16" fill="none">
      <path d="M1.5 1 8 8l-6.5 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SearchIcon({ color = '#121212' }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path
        d="M25.875 25.8746L22.0775 22.0771"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.125 24.125C20.991 24.125 24.125 20.991 24.125 17.125C24.125 13.259 20.991 10.125 17.125 10.125C13.259 10.125 10.125 13.259 10.125 17.125C10.125 20.991 13.259 24.125 17.125 24.125Z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Small circular speaker (used on vocab cards). variant color controlled by parent.
export function SpeakerSmall({ color = '#121212' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M3.33374 7.49984C2.64338 7.49984 2.08374 8.05948 2.08374 8.74984V11.2498C2.08374 11.9402 2.64338 12.4998 3.33374 12.4998H5.41707L8.50822 15.7146C8.89826 16.1203 9.58374 15.8442 9.58374 15.2814V4.71824C9.58374 4.1555 8.89826 3.8794 8.50822 4.28505L5.41707 7.49984H3.33374Z"
        fill={color}
      />
      <path
        d="M11.6663 7.0835C12.4297 7.86237 12.8573 8.90953 12.8573 10.0002C12.8573 11.0908 12.4297 12.138 11.6663 12.9168"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14.1663 5C14.8756 5.62561 15.4438 6.39501 15.8329 7.25708C16.2221 8.11915 16.4233 9.05416 16.4233 10C16.4233 10.9458 16.2221 11.8808 15.8329 12.7429C15.4438 13.605 14.8756 14.3744 14.1663 15"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

// Small bookmark glyph (used on vocab cards). fill/stroke controlled by parent.
export function BookmarkSmall({ fill = 'none', stroke = '#121212' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path
        d="M5 3.5H15C15.1933 3.5 15.35 3.6567 15.35 3.85V16.8291C15.35 17.1123 15.0312 17.2786 14.7992 17.1162L10.9467 14.4191C10.3786 14.0215 9.62141 14.0215 9.05332 14.4191L5.20083 17.1162C4.96878 17.2786 4.65 17.1123 4.65 16.8291V3.85C4.65 3.6567 4.8067 3.5 5 3.5Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect x="3.92578" y="7.88916" width="11.5742" height="10.1274" rx="1.44678" fill="white" />
      <path
        d="M9.71387 2.3252C11.536 2.3252 13.0127 3.80192 13.0127 5.62402V7.51465C13.0125 9.05186 11.7667 10.2978 10.2295 10.2979H9.19824C7.66103 10.2978 6.41525 9.05184 6.41504 7.51465V5.62402C6.41506 3.80193 7.89177 2.32522 9.71387 2.3252Z"
        stroke="white"
        strokeWidth="1.64963"
      />
    </svg>
  )
}

export function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3.33333 3.33373C3.33326 3.09912 3.3951 2.86865 3.51259 2.66559C3.63008 2.46252 3.79907 2.29406 4.0025 2.17719C4.20593 2.06033 4.43659 1.99921 4.67119 2.00001C4.9058 2.0008 5.13604 2.06349 5.33867 2.18173L13.3367 6.84706C13.5385 6.96418 13.7061 7.13223 13.8226 7.3344C13.9392 7.53657 14.0006 7.76579 14.0008 7.99915C14.001 8.23252 13.94 8.46184 13.8238 8.66422C13.7076 8.86659 13.5403 9.03493 13.3387 9.1524L5.33867 13.8191C5.13604 13.9373 4.9058 14 4.67119 14.0008C4.43659 14.0016 4.20593 13.9405 4.0025 13.8236C3.79907 13.7067 3.63008 13.5383 3.51259 13.3352C3.3951 13.1321 3.33326 12.9017 3.33333 12.6671V3.33373Z"
        fill="white"
        stroke="white"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChevronDownSmall() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <path d="M1.6 2.8 4 5.2l2.4-2.4" stroke="#121212" strokeWidth=".9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
