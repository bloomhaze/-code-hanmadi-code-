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
  // 하나로 굳어진 전치사·부사 표현 (통째로 묶여야 뜻이 통함)
  'at the last minute',
  'in the meantime',
  'out of nowhere',
  'all of a sudden',
  'for a while',
  'on purpose',
  'by the way',
  'in advance',
  'at least',
  'as soon as',
  'in the end',
  'a couple of',
  'a lot of',
  'made my day',
  'make my day',
  'kind of',
  'sort of',
  'no matter what',
  'as usual',
  'in person',
  'on time',
  'at first',
  'after all',
  // 관용 표현(활용형 포함)
  'mind goes blank',
  'mind went blank',
  'my mind goes blank',
  'my mind went blank',
  'change my mind',
  'make up my mind',
  'keep in mind',
  'end up',
  'ended up',
  'give it a try',
  'let it go',
]

// 분리형으로도 잡아야 하는 대표 구동사(기본형). "wear out" → "wears me out" 처럼
// 동사가 활용되고 중간에 목적어(me/it/them 등)가 껴도 통째로 잡는다.
const PHRASAL_VERBS = [
  'wear out', 'tire out', 'try out', 'pick up', 'turn off', 'turn on', 'figure out', 'work out',
  'give up', 'put on', 'take off', 'throw away', 'bring up', 'calm down', 'cheer up', 'check out',
  'fill out', 'find out', 'hand in', 'let down', 'look up', 'make up', 'pay off', 'point out',
  'set up', 'sort out', 'use up', 'write down', 'knock out', 'freak out', 'wipe out', 'call off',
  'drop off', 'pick out', 'shut down', 'break down', 'hold up', 'kick out', 'lock up', 'mess up',
  'pull off', 'push away', 'talk over', 'think over', 'turn down', 'wake up', 'warm up',
]

// 동사의 흔한 활용형 집합 (규칙 변화 위주)
function verbForms(v) {
  const f = new Set([v, v + 's', v + 'es', v + 'ed', v + 'ing'])
  if (v.endsWith('e')) {
    f.add(v.slice(0, -1) + 'ing')
    f.add(v + 'd')
  }
  if (v.endsWith('y')) {
    f.add(v.slice(0, -1) + 'ies')
    f.add(v.slice(0, -1) + 'ied')
  }
  return f
}

const PV_INDEX = PHRASAL_VERBS.map((pv) => {
  const [verb, particle] = pv.split(' ')
  return { forms: verbForms(verb), particle }
})

// 위치 i에서 "동사(활용형) + 목적어대명사 1~2개 + 부사" 분리형 구동사면 그 길이(3~4)를 반환.
function matchSeparable(toks, i, clean) {
  const w0 = clean(toks[i]).toLowerCase()
  for (const pv of PV_INDEX) {
    if (!pv.forms.has(w0)) continue
    for (let mid = 1; mid <= 2; mid++) {
      const partIdx = i + 1 + mid
      if (partIdx >= toks.length) break
      let midOk = true
      for (let k = 1; k <= mid; k++) {
        if (!PRONOUNS.has(clean(toks[i + k]).toLowerCase())) {
          midOk = false
          break
        }
      }
      if (midOk && clean(toks[partIdx]).toLowerCase() === pv.particle) return mid + 2
    }
  }
  return 0
}

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
    // 분리형 구동사(동사 활용형 + 목적어 + 부사) 우선 — AI가 전체 구간을 안 줘도 잡는다.
    const sepLen = matchSeparable(toks, i, clean)
    if (sepLen >= 3) {
      const ws = toks.slice(i, i + sepLen)
      out.push({
        t: ws.join(' '),
        term: `${clean(ws[0])} ${clean(ws[sepLen - 1])}`,
        isPhrase: true,
        sep: [
          { t: ws[0], hl: true },
          { t: ' ' + ws.slice(1, sepLen - 1).join(' ') + ' ', hl: false },
          { t: ws[sepLen - 1], hl: true },
        ],
      })
      i += sepLen - 1
      continue
    }

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
