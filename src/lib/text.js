// Multi-word expressions to keep together when a learner taps a word.
export const PHRASES = [
  'ran into',
  'run into',
  'caught up on',
  'catch up on',
  'look forward to',
  'looked forward to',
  'fell back into',
  'out of the blue',
  'at ease',
  'hard-hitting',
]

// Tokenize an English sentence into tappable tokens, grouping known phrases.
// Returns [{ t, term, isPhrase }] where t keeps original spacing/punctuation.
export function mkWords(en) {
  const sentence = String(en || '')
  const toks = sentence.split(/\s+/).filter(Boolean)
  const clean = (s) => s.replace(/^[^A-Za-z'’-]+|[^A-Za-z'’-]+$/g, '')
  const out = []
  for (let i = 0; i < toks.length; i++) {
    let matched = null
    for (const p of PHRASES) {
      const words = p.split(' ')
      if (i + words.length > toks.length) continue
      let ok = true
      for (let j = 0; j < words.length; j++) {
        if (clean(toks[i + j]).toLowerCase() !== words[j]) {
          ok = false
          break
        }
      }
      if (ok && (!matched || words.length > matched.length)) matched = { length: words.length, term: p }
    }
    const span = matched ? matched.length : 1
    const raw = toks.slice(i, i + span).join(' ')
    const term = matched ? matched.term : clean(raw)
    out.push({ t: raw, term, isPhrase: !!matched })
    i += span - 1
  }
  return out
}

// Highlight occurrences of `term` inside an example sentence (accent blue),
// expanding to full word boundaries so inflected forms highlight fully.
// Returns [{ t, accent }].
export function hlSegs(text, term) {
  text = text || ''
  term = (term || '').trim()
  if (!term) return [{ t: text, accent: false }]

  const out = []
  let rest = text
  const lc = term.toLowerCase()
  const isW = (ch) => /[A-Za-z'’-]/.test(ch)
  let guard = 0

  while (rest && guard++ < 500) {
    const idx = rest.toLowerCase().indexOf(lc)
    if (idx < 0) {
      out.push({ t: rest, accent: false })
      break
    }
    let s = idx
    let e = idx + term.length
    while (s > 0 && isW(rest[s - 1])) s--
    while (e < rest.length && isW(rest[e])) e++
    if (e <= idx) e = idx + Math.max(1, term.length)
    if (s > 0) out.push({ t: rest.slice(0, s), accent: false })
    out.push({ t: rest.slice(s, e), accent: true })
    rest = rest.slice(e)
  }
  return out.filter((s) => s.t)
}
