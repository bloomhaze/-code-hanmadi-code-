import { SEG_STYLE } from '../data/diary.js'

// Renders an array of {t, kind} segments — used for both original (with
// strike-through 오탈자) and corrected (highlighted) English sentences.
export default function SegmentText({ segments, className = '', style = {} }) {
  return (
    <span className={className} style={style}>
      {segments.map((s, i) => {
        const st = SEG_STYLE[s.kind] || SEG_STYLE.n
        return (
          <span
            key={i}
            style={{
              background: st.bg,
              color: st.color,
              borderRadius: st.bg === 'transparent' ? 0 : 5,
              padding: st.bg === 'transparent' ? 0 : '1px 3px',
              textDecoration: st.strike ? 'line-through' : 'none',
              textDecorationColor: '#ff7a7a',
              fontWeight: st.weight,
            }}
          >
            {s.t}
          </span>
        )
      })}
    </span>
  )
}
