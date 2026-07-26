// Multi-word expressions to keep together when a learner taps a word.
// 구동사(phrasal verbs) + 관용 표현(idioms). 실제 번역 결과에선 AI가 문장별
// phrases 를 함께 주므로 이 목록은 mock/폴백용 기본값이다.
export const PHRASES = [
  // phrasal verbs
  'ran into',
  'run into',
  'caught up on',
  'catch up on',
  'look forward to',
  'looked forward to',
  'came across',
  'come across',
  'fell back into',
  'get along with',
  'gave up',
  'give up',
  // idioms
  'out of the blue',
  'at ease',
  'hard-hitting',
  'piece of cake',
  'break the ice',
  'under the weather',
  'once in a while',
  'on the same page',
  'in the same boat',
  'a blessing in disguise',
]

// Tokenize an English sentence into tappable tokens, grouping known phrases.
// `extra` is a list of surface-form phrases (구동사/관용표현) for THIS sentence,
// e.g. from the AI translation — merged with the built-in list so any phrasal
// verb gets grabbed as one unit. Returns [{ t, term, isPhrase }].
export function mkWords(en, extra = []) {
  const sentence = String(en || '')
  const toks = sentence.split(/\s+/).filter(Boolean)
  const clean = (s) => s.replace(/^[^A-Za-z'’-]+|[^A-Za-z'’-]+$/g, '')
  // 문장별 표현 + 기본 목록. 여러 단어짜리만, 길이 긴 것 우선(그리디).
  const phrases = [...new Set([...extra, ...PHRASES].map((p) => String(p || '').trim().toLowerCase()))]
    .filter((p) => p.split(/\s+/).length >= 2)
  const out = []
  for (let i = 0; i < toks.length; i++) {
    let matched = null
    for (const p of phrases) {
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
    let term = matched ? matched.term : clean(raw)

    // 분리형 구동사(예: "tried it out") — 중간 목적어는 일반, 동사+부사만 하이라이트.
    let sep = null
    if (matched && span >= 3) {
      const ws = toks.slice(i, i + span)
      const last = clean(ws[span - 1]).toLowerCase()
      const mids = ws.slice(1, span - 1).map((w) => clean(w).toLowerCase())
      if (PARTICLES.has(last) && mids.length && mids.every((m) => PRONOUNS.has(m))) {
        sep = [
          { t: ws[0], hl: true },
          { t: ' ' + ws.slice(1, span - 1).join(' ') + ' ', hl: false },
          { t: ws[span - 1], hl: true },
        ]
        term = `${clean(ws[0])} ${clean(ws[span - 1])}` // 구동사(동사+부사)
      }
    }
    out.push({ t: raw, term, isPhrase: !!matched, sep })
    i += span - 1
  }
  return out
}

// 분리형 구동사 판별용 — 부사(파티클) / 목적어 대명사
const PARTICLES = new Set(['out', 'up', 'off', 'on', 'over', 'away', 'back', 'down', 'in', 'through', 'around', 'apart'])
const PRONOUNS = new Set(['it', 'them', 'him', 'her', 'me', 'us', 'you', 'this', 'that', 'one'])

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
